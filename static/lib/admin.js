'use strict';

define('admin/plugins/gitbub-embed', ['settings'], function (Settings) {
	var githubEmbed = {};

	githubEmbed.init = function () {
		Settings.load('github-embed', $('.github-embed-settings'));

		$('#save').on('click', function() {
			Settings.save('github-embed', $('.github-embed-settings'));
		});
	};

	return githubEmbed;
});
