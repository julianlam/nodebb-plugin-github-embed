'use strict';

const request = require('request-promise-native');

const winston = require.main.require('winston');
const meta = require.main.require('./src/meta');
const utils = require.main.require('./src/utils');

const escape = require('escape-html');
const striptags = require('striptags');

const issueRegex = /(?:^|[\s])(?:[\w\d\-.]+\/[\w\d\-.]+|gh|GH)#\d+\b/gm;
const commitRegex = /(?:^|[\s])(?:[\w\d\-.]+\/[\w\d\-.]+|gh|GH)@[A-Fa-f0-9]{7,}\b/gm;
const fullUrlIssueRegex = /https:\/\/github.com\/([\w\d\-.]+\/[\w\d\-.]+)\/issues\/([\d]+)/g;
const fullUrlPRRegex = /https:\/\/github.com\/([\w\d\-.]+\/[\w\d\-.]+)\/pull\/([\d]+)/g;
const fullUrlCommitRegex = /https:\/\/github.com\/([\w\d\-.]+\/[\w\d\-.]+)\/commit\/([A-Fa-f0-9]{7,})/g;
let issueCache;
let commitCache;
let appModule;

const Embed = module.exports;

Embed.init = async ({ app, router, middleware }) => {
	function render(req, res) {
		res.render('admin/plugins/github-embed', {});
	}

	appModule = app;
	router.get('/admin/plugins/github-embed', middleware.admin.buildHeader, render);
	router.get('/api/admin/plugins/github-embed', render);

	const { cacheHours } = await meta.settings.get('github-embed');

	issueCache = require('lru-cache')({
		maxAge: 1000 * 60 * 60 * (cacheHours || 6),
		max: 100,
	});

	commitCache = require('lru-cache')({
		maxAge: 1000 * 60 * 60 * (cacheHours || 6),
		max: 100,
	});
};

Embed.buildMenu = function (custom_header, callback) {
	custom_header.plugins.push({
		route: '/plugins/github-embed',
		icon: 'fa-github',
		name: 'GitHub Embed',
	});

	callback(null, custom_header);
};

Embed.parse = async (data) => {
	const issueKeys = [];
	const commitKeys = [];
	const ltrimRegex = /^\s+/;
	const raw = typeof data !== 'object';
	const fullUrlIssueMatch = {};
	const fullUrlPRMatch = {};
	const fullUrlCommitMatch = {};

	const { defaultRepo } = await meta.settings.get('github-embed');

	const cleanedText = striptags((raw ? data : data.postData.content).replace(/<blockquote>[\s\S]+?<\/blockquote>/g, ''));
	const issueMatches = cleanedText.match(issueRegex);
	const commitMatches = cleanedText.match(commitRegex);

	if (issueMatches && issueMatches.length) {
		issueMatches.forEach((match) => {
			match = match.replace(ltrimRegex, '');

			if (match.slice(0, 2).toLowerCase() === 'gh') {
				if (defaultRepo) {
					match = defaultRepo + match.slice(2);
				} else {
					// If a defaultRepo is not defined, skip this match.
					match = null;
				}
			}

			if (match !== null && issueKeys.indexOf(match) === -1) {
				issueKeys.push(match);
			}
		});
	}

	// eslint-disable-next-line no-cond-assign
	while (fullUrlIssueMatch.obj = fullUrlIssueRegex.exec(cleanedText)) {
		fullUrlIssueMatch.repo = fullUrlIssueMatch.obj[1];
		fullUrlIssueMatch.issue = fullUrlIssueMatch.obj[2];

		issueKeys.push([fullUrlIssueMatch.repo, fullUrlIssueMatch.issue].join('#'));
	}

	// eslint-disable-next-line no-cond-assign
	while (fullUrlPRMatch.obj = fullUrlPRRegex.exec(cleanedText)) {
		fullUrlPRMatch.repo = fullUrlPRMatch.obj[1];
		fullUrlPRMatch.issue = fullUrlPRMatch.obj[2];

		issueKeys.push([fullUrlPRMatch.repo, fullUrlPRMatch.issue].join('#'));
	}

	if (commitMatches && commitMatches.length) {
		commitMatches.forEach((match) => {
			match = match.replace(ltrimRegex, '');

			if (match.slice(0, 2).toLowerCase() === 'gh') {
				if (defaultRepo !== undefined) {
					match = defaultRepo + match.slice(2);
				} else {
					// If a defaultRepo is not defined, skip this match.
					match = null;
				}
			}

			if (match !== null && commitKeys.indexOf(match) === -1) {
				commitKeys.push(match);
			}
		});
	}

	// eslint-disable-next-line no-cond-assign
	while (fullUrlCommitMatch.obj = fullUrlCommitRegex.exec(cleanedText)) {
		fullUrlCommitMatch.repo = fullUrlCommitMatch.obj[1];
		fullUrlCommitMatch.commit = fullUrlCommitMatch.obj[2];

		commitKeys.push([fullUrlCommitMatch.repo, fullUrlCommitMatch.commit].join('@'));
	}

	const payload = await utils.promiseParallel({
		issues: Promise.all(issueKeys.map(async (issueKey) => {
			if (issueCache.has(issueKey)) {
				return issueCache.get(issueKey);
			}

			const issueObj = await Embed.getIssueData(issueKey);
			issueCache.set(issueKey, issueObj);
			return issueObj;
		})),
		commits: Promise.all(commitKeys.map(async (commitKey) => {
			if (commitCache.has(commitKey)) {
				return commitCache.get(commitKey);
			}

			const commitObj = await Embed.getCommitData(commitKey);
			commitCache.set(commitKey, commitObj);
			return commitObj;
		})),
	});

	// Filter out non-existant issues
	payload.issues = payload.issues.filter(Boolean);
	payload.commits = payload.commits.filter(Boolean);

	const embeds = payload.issues.concat(payload.commits);

	if (embeds.length) {
		const cardHTML = await appModule.renderAsync('partials/embed-block', {
			embeds: embeds,
		});

		if (raw) {
			data += cardHTML;
		} else {
			data.postData.content += cardHTML;
		}
	}

	return data;
};

Embed.getIssueData = async (issueKey) => {
	const issueData = issueKey.split('#');
	const repo = issueData[0];
	const issueNum = issueData[1];
	const reqOpts = {
		url: `https://api.github.com/repos/${repo}/issues/${issueNum}`,
		json: true,
		headers: {
			'User-Agent': 'nodebb-plugin-github-embed',
		},
		resolveWithFullResponse: true,
	};
	const { clientId, clientSecret, personalAccessToken } = await meta.settings.get('github-embed');

	if (personalAccessToken) {
		reqOpts.auth = {
			user: personalAccessToken,
			pass: 'x-oauth-basic',
		};
	} else if (clientId && clientSecret) {
		reqOpts.auth = {
			user: clientId,
			pass: clientSecret,
		};
	}

	const { statusCode, body: issue } = await request.get(reqOpts);

	switch (statusCode) {
		case 200: {
			const returnData = {
				type: {
					issue: !issue.hasOwnProperty('pull_request'),
					commit: false,
					pr: issue.hasOwnProperty('pull_request'),
				},
				repo: repo,
				number: issue.number,
				url: issue.html_url,
				title: escape(issue.title),
				state: issue.state,
				draft: issue.hasOwnProperty('pull_request') ? issue.draft : null,
				created: issue.created_at,
				user: {
					login: issue.user.login,
					url: issue.user.html_url,
					picture: issue.user.avatar_url,
				},
			};

			return returnData;
		}

		case 404: {
			winston.verbose(`[plugins/github-embed] No matching issue ${issueNum} in repository ${repo}`);
			break;
		}

		case 410: {
			winston.verbose(`[plugins/github-embed] Issue ${issueNum} in repository ${repo} has been deleted.`);
			break;
		}

		default: {
			winston.warn(`[plugins/github-embed] Received HTTP ${statusCode} from GitHub (${issueKey})`);
			break;
		}
	}
};

Embed.getCommitData = async (commitKey) => {
	const commitData = commitKey.split('@');
	const repo = commitData[0];
	const hash = commitData[1];
	const reqOpts = {
		url: `https://api.github.com/repos/${repo}/commits/${hash}`,
		json: true,
		headers: {
			'User-Agent': 'nodebb-plugin-github-embed',
		},
		resolveWithFullResponse: true,
	};
	const { clientId, clientSecret, personalAccessToken } = await meta.settings.get('github-embed');

	if (personalAccessToken) {
		reqOpts.auth = {
			user: personalAccessToken,
			pass: 'x-oauth-basic',
		};
	} else if (clientId && clientSecret) {
		reqOpts.auth = {
			user: clientId,
			pass: clientSecret,
		};
	}

	const { statusCode, body } = await request.get(reqOpts);

	switch (statusCode) {
		case 200: {
			const commit = body;
			commit.author = commit.author || {};

			return {
				type: {
					issue: false,
					commit: true,
					pr: false,
				},
				repo: repo,
				sha: commit.sha,
				url: commit.html_url,
				message: escape(commit.commit.message),
				created: commit.commit.author.date,
				commentCount: commit.commit.comment_count,
				user: {
					login: commit.author.login,
					url: commit.author.html_url,
					picture: commit.author.avatar_url,
				},
			};
		}

		case 404: {
			winston.verbose(`[plugins/github-embed] No matching commit ${hash} in repository ${repo}`);
			break;
		}
	}
};
