'use strict';

define('admin/plugins/gitbub-embed', ['settings'], function (Settings) {
	var githubEmbed = {};

	githubEmbed.init = function () {
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
	};

	return githubEmbed;
});
