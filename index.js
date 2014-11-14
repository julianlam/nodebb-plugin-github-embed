/* jshint indent: 4 */

var	request = require('request'),
    async = module.parent.require('async'),
    winston = module.parent.require('winston'),
    S = module.parent.require('string'),
    meta = module.parent.require('./meta'),

    issueRegex = /(?:^|[\s])(?:[\w\d\-.]+\/[\w\d\-.]+|gh|GH)#\d+\b/gm,
    Embed = {},
    cache, defaultRepo, tokenString, personalAccessToken, appModule;

Embed.init = function(data, callback) {
    function render(req, res, next) {
        res.render('admin/plugins/github-embed', {});
    }

    appModule = data.router;
    data.router.get('/admin/plugins/github-embed', data.middleware.admin.buildHeader, render);
    data.router.get('/api/admin/plugins/github-embed', render);

    callback();
};

Embed.buildMenu = function(custom_header, callback) {
    custom_header.plugins.push({
        "route": '/plugins/github-embed',
        "icon": 'fa-github',
        "name": 'GitHub Embed'
    });

    callback(null, custom_header);
};

Embed.parse = function(data, callback) {
    var issueKeys = [],
        ltrimRegex = /^\s+/,
        raw = typeof data !== 'object',
        matches, cleanedText,

    cleanedText = S((raw ? data : data.postData.content).replace(/<blockquote>[\s\S]+?<\/blockquote>/g, '')).stripTags().s;
    matches = cleanedText.match(issueRegex);

    if (matches && matches.length) {
        matches.forEach(function(match) {
            match = match.replace(ltrimRegex, '');

            if (match.slice(0, 2).toLowerCase() === 'gh' && defaultRepo !== undefined) {
                match = defaultRepo + match.slice(2);
            }

            if (issueKeys.indexOf(match) === -1) {
                issueKeys.push(match);
            }
        });
    }

    async.map(issueKeys, function(issueKey, next) {
        if (cache.has(issueKey)) {
            next(null, cache.get(issueKey));
        } else {
            getIssueData(issueKey, function(err, issueObj) {
                if (err) {
                    return next(err);
                }

                cache.set(issueKey, issueObj);
                next(err, issueObj);
            });
        }
    }, function(err, issues) {
        if (!err) {
            // Filter out non-existant issues
            issues = issues.filter(function(issue) {
                return issue;
            });

            appModule.render('partials/issues-block', {
                issues: issues
            }, function(err, cardHTML) {
                if (raw) {
                    var payload = data += cardHTML;
                } else {
                    data.postData.content += cardHTML;
                }
                callback(null, payload || data);
            });
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
            url: 'https://api.github.com/repos/' + repo + '/issues/' + issueNum + tokenString,
            headers: {
                'User-Agent': 'nodebb-plugin-github-embed'
            }
        };

        if (personalAccessToken) {
            reqOpts.auth = {
                user: personalAccessToken,
                pass: 'x-oauth-basic'
            };
        }

    request.get(reqOpts, function(err, response, body) {
        if (err) {
            return callback(err);
        }
        if (response && response.statusCode === 200) {
            var issue = JSON.parse(body),
                returnData = {
                    repo: repo,
                    number: issue.number,
                    url: issue.html_url,
                    title: issue.title,
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
        } 
    });
};

// Initial setup
meta.settings.get('github-embed', function(err, settings) {
    defaultRepo = settings.defaultRepo;

    cache = require('lru-cache')({
        maxAge: 1000*60*60*(settings.cacheHours || 6),
        max: 100
    });

    if (settings.clientId && settings.clientSecret) {
        tokenString = '?client_id=' + settings.clientId + '&client_secret=' + settings.clientSecret;
    }

    if (settings.personalAccessToken) {
        personalAccessToken = settings.personalAccessToken;
    }
});

module.exports = Embed;
