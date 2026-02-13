import { sentrySvelteKit } from '@sentry/sveltekit';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			adapter: 'node',
			sourceMapsUploadOptions: {
				org: 'hack-club',
				project: 'construct',
				authToken: process.env.SENTRY_AUTH_TOKEN
			}
		}),
		tailwindcss(),
		sveltekit()
	],
	test: {
		exclude: ['e2e/**', 'node_modules/**']
	},
	ssr: {
		// leave pg to be required at runtime by Node
		external: ['pg']
	},
	build: {
		rollupOptions: {
			// also treat any pg/* imports as external during rollup
			external: (id) => typeof id === 'string' && /^pg(\/|$)/.test(id)
		}
	},
	server: {
		host: true,
		// allowedHosts: ['cb7487613e18.ngrok-free.app'],
		port: 5173,
		strictPort: true,
		watch: {
			usePolling: true
		},
		hmr: {
			clientPort: 5173,
			host: 'localhost'
		}
	}
});
