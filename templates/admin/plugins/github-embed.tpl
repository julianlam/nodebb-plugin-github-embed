<h1>GitHub Embed</h1>

<form class="form github-embed-settings">
	<div class="row">
		<div class="col-sm-6">
			<div class="form-group">
				<label for="defaultRepo">Default Repository</label>
				<input type="text" class="form-control" id="defaultRepo" name="defaultRepo" placeholder="NodeBB/NodeBB" />
				<span class="help-block">The default repository value is optional, but would allow you to reference issues simply by providing the issue number (e.g. #1234). This field expects the repository owner and repository name, separated by a forward slash (/).</span>
			</div>
		</div>
		<div class="col-sm-6">
			<div class="form-group">
				<label for="clientId">Client ID/Secret Pair</label>
				<div class="row">
					<div class="col-xs-5">
						<input type="text" class="form-control" id="clientId" name="clientId" placeholder="Client ID" />
					</div>
					<div class="col-xs-7">
						<input type="text" class="form-control" id="clientSecret" name="clientSecret" placeholder="Client Secret" />
					</div>
				</div>
				<span class="help-block">Optional. Without a client ID/secret pair, requests are rate-limited to one per minute.</span>
			</div>
			<div class="form-group">
				<label for="cacheHours">Number of hours to cache issue data</label>
				<input type="text" class="form-control" id="cacheHours" name="cacheHours" placeholder="6" />
				<span class="help-block">To reduce the number of calls to GitHub, this plugin will remember issue data for a specified number of hours. (Default: 6)</span>
			</div>
		</div>
	</div>

	<button type="button" class="btn btn-lg btn-primary" id="save">Save</button>
</form>

<script type="text/javascript">
	require(['settings'], function(Settings) {
		Settings.load('github-embed', $('.github-embed-settings'));

		$('#save').on('click', function() {
			Settings.save('github-embed', $('.github-embed-settings'), function() {
				app.alert({
					alert_id: 'github-embed',
					type: 'info',
					title: 'Settings Changed',
					message: 'Please restart your NodeBB to apply these changes',
					timeout: 5000,
					clickfn: function() {
						socket.emit('admin.restart');
					}
				});
			});
		});
	});
</script>