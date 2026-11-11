import { sveltekit } from '@sveltejs/kit/vite';
import { execSync } from 'node:child_process';
import { imagetools } from 'vite-imagetools';
import { defineConfig } from 'vitest/config';
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(() => {
	const commitDescribe = execSync('git describe --tags').toString().trimEnd();
	const commitDate = execSync('git log -1 --format=%cI').toString().trimEnd();
	const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trimEnd();
	const commitHash = execSync('git rev-parse HEAD').toString().trimEnd();

	process.env.VITE_GIT_COMMIT_DATE = commitDate;
	process.env.VITE_GIT_BRANCH_NAME = branchName;
	process.env.VITE_GIT_COMMIT_HASH = commitHash;
	process.env.VITE_APP_VERSION = commitDescribe;

	return {
		plugins: [
			sveltekit(),
			imagetools({
				defaultDirectives: () =>
					new URLSearchParams({
						format: 'webp'
					})
			}),
			visualizer({
				emitFile: true,
				filename: 'stats.html'
			})
		],
		assetsInclude: ['**/*.meme', '**/*.zip'],
		test: {
			include: ['src/**/*.{test,spec}.{js,ts}']
		},
		css: {
			preprocessorOptions: {
				scss: {
					api: 'modern-compiler'
				}
			}
		}
	};
});
