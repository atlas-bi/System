module.exports = {
	plugins: {
		// Flatten nested CSS so Remix's esbuild 0.17 parser can handle Tailwind v4 output.
		"@tailwindcss/postcss": {
			optimize: { minify: false },
		},
	},
};
