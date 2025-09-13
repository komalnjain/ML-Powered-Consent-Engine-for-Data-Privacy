import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react': 'react',
      'react-dom': 'react-dom',
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'cookie', 'set-cookie-parser'],
    exclude: ['react-router-dom'],
    esbuildOptions: {
      plugins: [
        {
          name: 'resolve-cookie',
          setup(build) {
            build.onResolve({ filter: /^cookie$/ }, (args) => {
              return { path: require.resolve('cookie') };
            });
            build.onLoad({ filter: /node_modules\/cookie\/index\.js$/ }, async (args) => {
              const contents = await require('fs').promises.readFile(args.path, 'utf8');
              return {
                contents: contents + '\nexport const parse = module.exports.parse;\nexport const serialize = module.exports.serialize;',
                loader: 'js',
              };
            });
          },
        },
        {
          name: 'resolve-set-cookie-parser',
          setup(build) {
            build.onResolve({ filter: /^set-cookie-parser$/ }, (args) => {
              return { path: require.resolve('set-cookie-parser') };
            });
            build.onLoad({ filter: /node_modules\/set-cookie-parser\/lib\/set-cookie\.js$/ }, async (args) => {
              const contents = await require('fs').promises.readFile(args.path, 'utf8');
              return {
                contents: contents + '\nexport const parse = module.exports.parse;\nexport const splitCookiesString = module.exports.splitCookiesString;',
                loader: 'js',
              };
            });
          },
        },
      ],
    },
  },
  build: {
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
}); 