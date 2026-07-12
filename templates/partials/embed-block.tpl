<div class="row github-embeds-container">
	{{{ each embeds }}}
	<div class="col-md-6">
		<div class="github-embed card">
			<div class="card-body">
				{{{ if embeds.type.issue }}}
				<div class="meta d-flex align-items-center flex-wrap gap-1">
					<img class="author-picture not-responsive rounded" src="{embeds.user.picture}" title="{embeds.user.login}" style="width: 24px;"/>
					<a href="{embeds.user.url}" class="text-reset text-decoration-none">
						<span class="username">{embeds.user.login}</span>
					</a> created this issue <span class="timeago" title="{embeds.created}"></span> in <a href="//github.com/{embeds.repo}">{embeds.repo}</a>
				</div>

				<h4 class="d-flex gap-2 align-items-center fs-6 flex-wrap">
					<a class="text-reset text-decoration-none" href="{embeds.url}">{embeds.title}</a>
					<span class="number">#{embeds.number}</span>
					<span class="badge {embeds.state}">{embeds.state}</span>
				</h4>
				{{{ end }}}

				{{{ if embeds.type.pr }}}
				<div class="meta">
					<img class="author-picture not-responsive rounded" src="{embeds.user.picture}" title="{embeds.user.login}" style="width: 24px;"/>
					<a href="{embeds.user.url}"><span class="username">{embeds.user.login}</span></a> opened this pull request <span class="timeago" title="{embeds.created}"></span> in <a href="//github.com/{embeds.repo}">{embeds.repo}</a>
				</div>

				<h4 class="d-flex gap-2 align-items-center fs-6 flex-wrap">
					<a class="text-reset text-decoration-none" href="{embeds.url}">{embeds.title}</a>
					<span class="number">#{embeds.number}</span>
					{{{ if !embeds.draft }}}
					<span class="badge {embeds.state}">{embeds.state}</span>
					{{{ else }}}
					<span class="badge bg-secondary">draft</span>
					{{{ end }}}
				</h4>
				{{{ end }}}

				{{{ if embeds.type.commit }}}
				<div class="meta d-flex align-items-center flex-wrap gap-1">
					<img class="author-picture not-responsive rounded" src="{embeds.user.picture}" title="{embeds.user.login}" style="width: 24px;"/>
					<a class="text-reset text-decoration-none" href="{embeds.user.url}">
						<span class="username">{embeds.user.login}</span>
					</a> committed <span class="timeago" title="{embeds.created}"></span> to <a href="//github.com/{embeds.repo}">{embeds.repo}</a>
					<span class="">{embeds.commentCount} <i class="fa fa-comment"></i></span>
				</div>
				<a class="text-reset text-decoration-none" href="{embeds.url}"><pre>{embeds.message}</pre></a>
				{{{ end }}}
			</div>
		</div>
	</div>
	{{{ end }}}
</div>