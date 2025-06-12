import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { envOnlyMacros } from 'vite-env-only'

const MODE = process.env.NODE_ENV

export default defineConfig({
  build: {
    target: 'es2022',
    cssMinify: MODE === 'production',
    rollupOptions: {
			external: [/node:.*/, 'fsevents'],
		},
  },
  plugins: [envOnlyMacros(), tailwindcss(), reactRouter(), tsconfigPaths()],
})
