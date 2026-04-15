/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
	cacheDirectory: "./node_modules/.cache/remix",
	ignoredRouteFiles: ["**/.*", "**/*.test.{js,jsx,ts,tsx}"],
	serverDependenciesToBundle: [
		"axios",
		"follow-redirects",
		"form-data",
		"proxy-from-env",
		"chartjs-adapter-date-fns",
	],
	serverModuleFormat: "cjs",
	tailwind: true,
	postcss: true,
	watchPaths: ["./lib/*"],
};
