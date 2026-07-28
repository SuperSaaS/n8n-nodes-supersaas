import { defineConfig } from 'vitest/config';

export default defineConfig({
	// n8n-workflow ships sourcemaps whose original sources are not published, which
	// makes Vite log a "points to missing source files" warning for every module it
	// loads. Nothing actionable, so keep the noise out of the test output.
	logLevel: 'error',
	test: {
		include: ['test/**/*.test.ts'],
		environment: 'node',
	},
});
