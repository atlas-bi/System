/// <reference types="vitest" />
/// <reference types="vite/client" />
const path = require("path");

/** @type {import('vitest/config').UserConfig} */
module.exports = {
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "app"),
			"@": path.resolve(__dirname),
		},
	},
	test: {
		globals: true,
		environment: "happy-dom",
		setupFiles: ["./test/setup-test-env.ts"],
		include: [
			"./app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
			"./lib/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
		],
		watchExclude: [
			".*\\/node_modules\\/.*",
			".*\\/build\\/.*",
			".*\\/postgres-data\\/.*",
		],
		coverage: {
			provider: "v8",
			reporter: ["text", "json-summary", "html", "lcov"],
			reportsDirectory: "./coverage",
			// Server-side logic only — UI components and route pages are excluded.
			include: [
				"app/monitors/**/*.{ts,tsx}",
				"app/notifications/**/*.{ts,tsx}",
				"app/queues/**/*.{ts,tsx}",
				"app/models/**/*.{ts,tsx}",
				"app/services/**/*.{ts,tsx}",
				"app/utils.ts",
				"app/utils.server.ts",
				"lib/**/*.{ts,tsx}",
			],
			exclude: [
				"**/*.test.{ts,tsx}",
				"**/*.spec.{ts,tsx}",
				"**/*.integration.test.{ts,tsx}",
				// SAML/LDAP integration — covered by manual/E2E auth flows, not unit tests.
				"app/services/auth.server.ts",
				"app/services/ldap.server.ts",
				// Host monitor runners — SSH/WMI/SQL integration, not unit-testable in isolation.
				"app/monitors/windows.server.ts",
				"app/monitors/ubuntu.server.ts",
				"app/monitors/sqlServer.server.ts",
			],
		},
	},
};
