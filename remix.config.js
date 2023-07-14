/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  // cacheDirectory: "./node_modules/.cache/remix",
  future: {
    v2_errorBoundary: true,
    v2_headers: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
  },
  ignoredRouteFiles: ['**/.*', '**/*.test.{js,jsx,ts,tsx}'],
  serverDependenciesToBundle: ['axios'],
  serverModuleFormat: 'cjs',
  tailwind: true,
  postcss: true,
  watchPaths: ['./lib/*'],
};
