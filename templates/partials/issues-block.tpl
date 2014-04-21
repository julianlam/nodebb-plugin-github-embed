<div class="row">
    <!-- BEGIN issues -->
    <div class="col-md-6">
        <div class="github-issue panel panel-default">
            <div class="panel-body">
                <div class="meta">
                    <img class="author-picture" src="{issues.user.picture}" title="{issues.user.login}" />
                    <a href="{issues.user.url}"><span class="username">{issues.user.login}</span></a> created this issue <span class="timeago" title="{issues.created}"></span> in <a href="//github.com/{issues.repo}">{issues.repo}</a>
                </div>
                <h3>
                    <span class="label label-default {issues.state} pull-right">{issues.state}</span>
                    <a href="{issues.url}">{issues.title}</a>
                    <span class="number">#{issues.number}</span>
                </h3>
            </div>
        </div>
    </div>
    <!-- END issues -->
</div>