import { defineConfig, loadEnv } from 'vite';

const path = require('path');
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname);

  return {
    plugins: [],
    esbuild: {},
    server: {
      port: 3333,
    },
    css: {},
    build: {
      emptyOutDir: true,
      lib: {
        entry: path.resolve(__dirname, 'src/index.ts'),
        name: 'FbAdsorber',
        fileName: format => `fabric-adsorber.js`,
        formats: ['es'],
      },
    },
  };
});
