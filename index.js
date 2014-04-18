var	request = require('request'),
    cache = require('lru-cache')({
        maxAge: 1000*60*60*24,  // One day
        max: 100
    }),
    async = module.parent.require('async'),
    winston = module.parent.require('winston'),

    repo = 'designcreateplay/NodeBB',
    issueRegex = /(?:^|[\s])(#\d+)/g,
    // repoIssueRegex = /abc/g,
    Embed = {};

Embed.parse = function(raw, callback) {
    var issues = [];

    while (match = issueRegex.exec(raw)) {
        if (issues.indexOf(match[1]) === -1) {
            issues.push(match[1]);
        }
    }

    async.map(issues, function(issue, next) {
        var cacheKey = repo + '/' + issue;

        if (cache.has(cacheKey)) {
            console.log('cache hit!', cacheKey);
            next(null, cache.get(cacheKey));
        } else {
            console.log('cache miss!', cacheKey);
            request.get({
                url: 'https://api.github.com/repos/designcreateplay/NodeBB/issues/' + issue.slice(1),
                headers: {
                    'User-Agent': 'julianlam'
                }
            }, function(err, response, body) {
                if (response.statusCode === 200) {
                    var issue = JSON.parse(body),
                        returnData = {
                            url: issue.html_url,
                            title: issue.title,
                            description: issue.body,
                            user: {
                                login: issue.user.login,
                                url: issue.user.html_url,
                                picture: issue.user.avatar_url
                            }
                        };

                    cache.set(cacheKey, returnData);
                    next(null, returnData);
                } else {
                    next(err);
                }
            });
        }
    }, function(err, issues) {
        if (!err) {
            var parsed = issues.reduce(function(content, issueObj) {
                    // console.log('parsing', issueObj);
                    return content += '<div class="github-issue"><h3>' + issueObj.title + '</h3><img class="author-picture" src="' + issueObj.user.picture + '" title="' + issueObj.user.login + '" /><p>' + issueObj.description + '</p></div>';
                }, raw);

            callback(null, parsed);
        } else {
            winston.warn('Encountered an error parsing GitHub embed codes, not continuing');
            callback(null, raw);
        }
    });
};

module.exports = Embed;