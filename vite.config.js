import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: ['dom-to-image', 'html2canvas']
	},
  server: {
    host: true,
    port: 5173,
  }
});
