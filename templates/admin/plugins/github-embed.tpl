<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->

	<div class="row m-0">
		<div id="spy-container" class="col-12 col-md-8 px-0 mb-4" tabindex="0">
			<form role="form" class="github-embed-settings">
				<div class="row">
					<div class="col-12">
						<div class="mb-3">
							<label for="defaultRepo">Default Repository</label>
							<input type="text" class="form-control" id="defaultRepo" name="defaultRepo" placeholder="NodeBB/NodeBB" />
							<span class="form-text">Optional. Allows you to reference issues simply by providing the issue number (e.g. gh#1234). This field expects the repository owner and repository name, separated by a forward slash (/).</span>
						</div>
						<div class="mb-3">
							<label for="cacheHours">Number of hours to cache issue data</label>
							<input type="text" class="form-control" id="cacheHours" name="cacheHours" placeholder="6" />
							<span class="form-text">To reduce the number of calls to GitHub, this plugin will remember issue data for a specified number of hours. (Default: 6)</span>
						</div>
					</div>
					<div class="col-12">
						<div class="mb-3">
							<label for="clientId">Client ID:</label>
							<input type="text" class="form-control" id="clientId" name="clientId" placeholder="Client ID" />
						</div>
						<div class="">
							<label for="clientSecret">Client Secret:</label>
							<input type="text" class="form-control" id="clientSecret" name="clientSecret" placeholder="Client Secret" />
						</div>
						<div class="mb-3">
							<span class="form-text">Optional. Without a client ID/secret pair, requests are rate-limited to one request per second.</span>
						</div>

						<div class="mb-3">
							<label for="personalAccessToken">Personal Access Token</label>
							<input type="text" class="form-control" id="personalAccessToken" name="personalAccessToken" />
							<p class="form-text">
								Optional. A <a href="https://github.com/blog/1509-personal-api-tokens">Personal Access Token</a> can also be
								generated in order to authenticate your requests, raise your API call limit, and access private repositories
								(if configured to do so).
							</p>
						</div>
					</div>
				</div>
			</form>
		</div>

		<!-- IMPORT admin/partials/settings/toc.tpl -->
	</div>
</div>
