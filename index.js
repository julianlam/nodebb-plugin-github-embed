'use strict';
/* globals require, module */

var request = require('request');
var async = require.main.require('async');
var winston = require.main.require('winston');
var meta = require.main.require('./src/meta');

var escape = require('escape-html');
var striptags = require('striptags');

var issueRegex = /(?:^|[\s])(?:[\w\d\-.]+\/[\w\d\-.]+|gh|GH)#\d+\b/gm,
    commitRegex = /(?:^|[\s])(?:[\w\d\-.]+\/[\w\d\-.]+|gh|GH)@[A-Fa-f0-9]{7,}\b/gm,
    fullUrlIssueRegex = /https:\/\/github.com\/([\w\d\-.]+\/[\w\d\-.]+)\/issues\/([\d]+)/g,
    fullUrlPRRegex = /https:\/\/github.com\/([\w\d\-.]+\/[\w\d\-.]+)\/pull\/([\d]+)/g,
    fullUrlCommitRegex = /https:\/\/github.com\/([\w\d\-.]+\/[\w\d\-.]+)\/commit\/([A-Fa-f0-9]{7,})/g,
    Embed = {},
    issueCache, commitCache, defaultRepo, personalAccessToken, appModule;

Embed.init = function(data, callback) {
    function render(req, res) {
        res.render('admin/plugins/github-embed', {});
    }

    appModule = data.router;
    data.router.get('/admin/plugins/github-embed', data.middleware.admin.buildHeader, render);
    data.router.get('/api/admin/plugins/github-embed', render);

    callback();
};

Embed.buildMenu = function(custom_header, callback) {
    custom_header.plugins.push({
        'route': '/plugins/github-embed',
        'icon': 'fa-github',
        'name': 'GitHub Embed'
    });

    callback(null, custom_header);
};

Embed.parse = function(data, callback) {
    var issueKeys = [],
        commitKeys = [],
        ltrimRegex = /^\s+/,
        raw = typeof data !== 'object',
        fullUrlIssueMatch = {},
        fullUrlPRMatch = {},
        fullUrlCommitMatch = {},
        issueMatches, commitMatches, cleanedText;

    cleanedText = striptags((raw ? data : data.postData.content).replace(/<blockquote>[\s\S]+?<\/blockquote>/g, ''));
    issueMatches = cleanedText.match(issueRegex);
    commitMatches = cleanedText.match(commitRegex);

    if (issueMatches && issueMatches.length) {
        issueMatches.forEach(function(match) {
            match = match.replace(ltrimRegex, '');

            if (match.slice(0, 2).toLowerCase() === 'gh') {
                if (defaultRepo !== undefined) {
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

    while(fullUrlIssueMatch.obj = fullUrlIssueRegex.exec(cleanedText)) {
        fullUrlIssueMatch.repo = fullUrlIssueMatch.obj[1];
        fullUrlIssueMatch.issue = fullUrlIssueMatch.obj[2];

        issueKeys.push([fullUrlIssueMatch.repo, fullUrlIssueMatch.issue].join('#'));
    }

    while(fullUrlPRMatch.obj = fullUrlPRRegex.exec(cleanedText)) {
        fullUrlPRMatch.repo = fullUrlPRMatch.obj[1];
        fullUrlPRMatch.issue = fullUrlPRMatch.obj[2];

        issueKeys.push([fullUrlPRMatch.repo, fullUrlPRMatch.issue].join('#'));
    }

    if (commitMatches && commitMatches.length) {
        commitMatches.forEach(function(match) {
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

    while(fullUrlCommitMatch.obj = fullUrlCommitRegex.exec(cleanedText)) {
        fullUrlCommitMatch.repo = fullUrlCommitMatch.obj[1];
        fullUrlCommitMatch.commit = fullUrlCommitMatch.obj[2];

        commitKeys.push([fullUrlCommitMatch.repo, fullUrlCommitMatch.commit].join('@'));
    }

    async.parallel({
        issues: function(next) {
            async.map(issueKeys, function(issueKey, next) {
                if (issueCache.has(issueKey)) {
                    next(null, issueCache.get(issueKey));
                } else {
                    getIssueData(issueKey, function(err, issueObj) {
                        if (err) {
                            return next(err);
                        }

                        issueCache.set(issueKey, issueObj);
                        next(err, issueObj);
                    });
                }
            }, next);
        },
        commits: function(next) {
            async.map(commitKeys, function(commitKey, next) {
                if (commitCache.has(commitKey)) {
                    next(null, commitCache.get(commitKey));
                } else {
                    getCommitData(commitKey, function(err, commitObj) {
                        if (err) {
                            return next(err);
                        }

                        commitCache.set(commitKey, commitObj);
                        next(err, commitObj);
                    });
                }
            }, next);
        }
    }, function(err, payload) {
        if (!err) {
            // Filter out non-existant issues
            payload.issues = payload.issues.filter(Boolean);
            payload.commits = payload.commits.filter(Boolean);

            var embeds = payload.issues.concat(payload.commits);

            if (embeds.length) {
                appModule.render('partials/embed-block', {
                    embeds: embeds
                }, function(err, cardHTML) {
                    if (raw) {
                        data = data += cardHTML;
                    } else {
                        data.postData.content += cardHTML;
                    }
                    callback(null, data);
                });
            } else {
                callback(null, data);
            }
        } else {
            winston.warn('Encountered an error parsing GitHub embed codes, not continuing');
            callback(null, data);
        }
    });
};

var getIssueData = function(issueKey, callback) {
    var issueData = issueKey.split('#'),
        repo = issueData[0],
        issueNum = issueData[1],
        reqOpts = {
            url: 'https://api.github.com/repos/' + repo + '/issues/' + issueNum,
            headers: {
                'User-Agent': 'nodebb-plugin-github-embed'
            }
        };

        if (personalAccessToken) {
            reqOpts.auth = {
                user: personalAccessToken,
                pass: 'x-oauth-basic'
            };
        } else if (Embed.settings.clientId && Embed.settings.clientSecret) {
            reqOpts.auth = {
                user: Embed.settings.clientId,
                pass: Embed.settings.clientSecret,
            };
        }

    request.get(reqOpts, function(err, response, body) {
        if (err) {
            return callback(err);
        }
        if (response && response.statusCode === 200) {
            var issue = JSON.parse(body),
                returnData = {
                    type: {
                        issue: true,
                        commit: false
                    },
                    repo: repo,
                    number: issue.number,
                    url: issue.html_url,
                    title: escape(issue.title),
                    state: issue.state,
                    // description: issue.body,
                    created: issue.created_at,
                    user: {
                        login: issue.user.login,
                        url: issue.user.html_url,
                        picture: issue.user.avatar_url
                    }
                };

            callback(null, returnData);
        } else if (response.statusCode === 404) {
            winston.verbose('[plugins/github-embed] No matching issue ' + issueNum + ' in repository ' + repo);
            callback();
        } else if (response.statusCode === 410) {
            winston.verbose('[plugins/github-embed] Issue ' + issueNum + ' in repository ' + repo + ' has been deleted.');
            callback();
        } else {
            winston.warn('[plugins/github-embed] Received HTTP ' + response.statusCode + ' from GitHub (' + issueKey + ')');
            callback();
        }
    });
};

var getCommitData = function(commitKey, callback) {
    var commitData = commitKey.split('@'),
        repo = commitData[0],
        hash = commitData[1],
        reqOpts = {
            url: 'https://api.github.com/repos/' + repo + '/commits/' + hash,
            headers: {
                'User-Agent': 'nodebb-plugin-github-embed'
            }
        };

        if (personalAccessToken) {
            reqOpts.auth = {
                user: personalAccessToken,
                pass: 'x-oauth-basic'
            };
        } else if (Embed.settings.clientId && Embed.settings.clientSecret) {
            reqOpts.auth = {
                user: Embed.settings.clientId,
                pass: Embed.settings.clientSecret,
            };
        }

    request.get(reqOpts, function(err, response, body) {
        if (err) {
            return callback(err);
        }
        if (response && response.statusCode === 200) {
            var commit = JSON.parse(body);
            commit.author = commit.author || {};

            var returnData = {
                    type: {
                        issue: false,
                        commit: true
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
                        picture: commit.author.avatar_url
                    }
                };

            callback(null, returnData);
        } else if (response.statusCode === 404) {
            winston.verbose('[plugins/github-embed] No matching commit ' + hash + ' in repository ' + repo);
            callback();
        }
    });
};

// Initial setup
meta.settings.get('github-embed', function(err, settings) {
    Embed.settings = settings;
    defaultRepo = settings.defaultRepo;

    issueCache = require('lru-cache')({
        maxAge: 1000*60*60*(settings.cacheHours || 6),
        max: 100
    });

    commitCache = require('lru-cache')({
        maxAge: 1000*60*60*(settings.cacheHours || 6),
        max: 100
    });

    if (settings.personalAccessToken) {
        personalAccessToken = settings.personalAccessToken;
    }
});

module.exports = Embed;
