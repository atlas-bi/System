const ref = process.env.GITHUB_REF;
const branch = ref.split('/').pop();

const config = {
	branches: [
		'master',
		{ name: 'dev', prerelease: 'rc' },
		{ name: 'alpha', prerelease: true },
	],
	plugins: [
		'@semantic-release/commit-analyzer',
		[
			'@semantic-release/release-notes-generator',
			{
				config: './node_modules/cz-conventional-changelog',
			},
		],
		[
			'@semantic-release/npm',
			{
				publish: 'false',
			},
		],
		[
			'@semantic-release/github',
			{
				assets: [{ path: 'build.tar.gz', name: 'build.tar.gz' }],
			},
		],
	],
};

if (
	config.branches.some(
		(it) => it === branch || (it.name === branch && !it.prerelease),
	)
) {
	config.plugins.push('@semantic-release/changelog', [
		'@semantic-release/git',
		{
			assets: ['CHANGELOG.md', 'package.json'],
			message:
				'chore(release): ${nextRelease.version} \n\n${nextRelease.notes}',
		},
	]);
}

module.exports = config;
