<div class="row github-embeds-container">
    <!-- BEGIN embeds -->
    <!-- IF embeds.type.issue -->
        <div class="col-md-6">
            <div class="github-embed card">
                <div class="card-body">
                    <div class="meta">
                        <img class="author-picture not-responsive" src="{embeds.user.picture}" title="{embeds.user.login}" />
                        <a href="{embeds.user.url}"><span class="username">{embeds.user.login}</span></a> created this issue <span class="timeago" title="{embeds.created}"></span> in <a href="//github.com/{embeds.repo}">{embeds.repo}</a>
                    </div>
                    <h3>
                        <span class="badge {embeds.state} float-end">{embeds.state}</span>
                        <a href="{embeds.url}">{embeds.title}</a>
                        <span class="number">#{embeds.number}</span>
                    </h3>
                </div>
            </div>
        </div>
    <!-- ENDIF embeds.type.issue -->
    <!-- IF embeds.type.commit -->
        <div class="col-md-6">
            <div class="github-embed card">
                <div class="card-body">
                    <div class="meta">
                        <span class="float-end">{embeds.commentCount} <i class="fa fa-comment"></i></span>
                        <img class="author-picture not-responsive" src="{embeds.user.picture}" title="{embeds.user.login}" />
                        <a href="{embeds.user.url}"><span class="username">{embeds.user.login}</span></a> committed <span class="timeago" title="{embeds.created}"></span> to <a href="//github.com/{embeds.repo}">{embeds.repo}</a>
                    </div>
                    <a href="{embeds.url}"><pre>{embeds.message}</pre></a>
                </div>
            </div>
        </div>
    <!-- ENDIF embeds.type.commit -->
    <!-- END embeds -->
</div>