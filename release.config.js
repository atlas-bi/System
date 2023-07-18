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
			'@semantic-release/exec',
			{
				prepareCmd:
					'tar -czvf build.tar.gz package.json build app lib prisma public styles .env.example CHANGELOG.md package-lock.json README.md remix.config.js remix.env.d.ts server.ts tailwind.config.ts tsconfig.json postcss.config.js',
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
