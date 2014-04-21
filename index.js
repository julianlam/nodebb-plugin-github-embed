var	request = require('request'),
    cache = require('lru-cache')({
        maxAge: 1000*60*60*24,  // One day
        max: 100
    }),
    async = module.parent.require('async'),
    winston = module.parent.require('winston'),
    S = module.parent.require('string'),
    meta = module.parent.require('./meta'),

    issueRegex = /(?:^|[\s])(?:\w+\/\w+)?#\d+\b/g,
    Embed = {},
    defaultRepo;

Embed.init = function(app, middleware, controllers) {
    function render(req, res, next) {
        res.render('admin/plugins/github-embed', {});
    }

    app.get('/admin/plugins/github-embed', middleware.admin.buildHeader, render);
    app.get('/api/admin/plugins/github-embed', render);
};

Embed.buildMenu = function(custom_header, callback) {
    custom_header.plugins.push({
        "route": '/plugins/github-embed',
        "icon": 'fa-github',
        "name": 'GitHub Embed'
    });

    callback(null, custom_header);
}

Embed.parse = function(raw, callback) {
    var issueKeys = [],
        ltrimRegex = /^\s+/,
        matches, cleanedText;

    cleanedText = S(raw).stripTags().s;
    matches = cleanedText.match(issueRegex);

    if (matches && matches.length) {
        matches.forEach(function(match) {
            match = match.replace(ltrimRegex, '');

            if (match[0] === '#' && defaultRepo !== undefined) {
                match = defaultRepo + match;
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

            var parsed = issues.reduce(function(content, issueObj) {
                    return content += '<div class="github-issue panel panel-default"> \
                        <div class="panel-body"> \
                            <div class="meta"> \
                                <img class="author-picture" src="' + issueObj.user.picture + '" title="' + issueObj.user.login + '" /> \
                                <a href="' + issueObj.user.url + '"><span class="username">' + issueObj.user.login + '</span></a> created this issue <span class="timeago" title="' + issueObj.created + '"></span> in <a href="//github.com/' + issueObj.repo + '">' + issueObj.repo + '</a> \
                            </div> \
                            <h3> \
                                <span class="label label-default ' + issueObj.state + ' pull-right">' + issueObj.state + '</span> \
                                <a href="' + issueObj.url + '">' + issueObj.title + '</a> \
                                <span class="number">#' + issueObj.number + '</span> \
                            </h3> \
                            </div> \
                        </div>';
                }, raw);

            callback(null, parsed);
        } else {
            winston.warn('Encountered an error parsing GitHub embed codes, not continuing');
            callback(null, raw);
        }
    });
};

var getIssueData = function(issueKey, callback) {
    var issueData = issueKey.split('#'),
        repo = issueData[0],
        issueNum = issueData[1];

    request.get({
        url: 'https://api.github.com/repos/' + repo + '/issues/' + issueNum,
        headers: {
            'User-Agent': 'julianlam'
        }
    }, function(err, response, body) {
        if (response.statusCode === 200) {
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
        } else {
            callback(err);
        }
    });
}

// Initial setup
meta.settings.get('github-embed', function(err, settings) {
    defaultRepo = settings.defaultRepo
});

module.exports = Embed;