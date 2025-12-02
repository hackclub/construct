import { sentrySvelteKit } from '@sentry/sveltekit';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			sourceMapsUploadOptions: {
				org: 'hack-club',
				project: 'construct'
			}
		}),
		tailwindcss(),
		sveltekit()
	],
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
		fs: {
			allow: ['uploads']
		},
		host: true,
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
