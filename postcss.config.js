module.exports = {
	plugins: {
		// Flatten nested CSS so Remix/esbuild can parse Tailwind v4 output in dev.
		"@tailwindcss/postcss": {
			optimize: { minify: false },
		},
	},
};
