/// <reference types="vitest" />
/// <reference types="vite/client" />
const path = require('path');

/** @type {import('vitest/config').UserConfig} */
module.exports = {
	resolve: {
		alias: {
			'~': path.resolve(__dirname, 'app'),
			'@': path.resolve(__dirname),
		},
	},
	test: {
		globals: true,
		environment: 'happy-dom',
		setupFiles: ['./test/setup-test-env.ts'],
		include: ['./app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		watchExclude: [
			'.*\\/node_modules\\/.*',
			'.*\\/build\\/.*',
			'.*\\/postgres-data\\/.*',
		],
	},
};
