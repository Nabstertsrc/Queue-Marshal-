import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    base: './',
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    build: {
      rollupOptions: {
        cache: false
      }
    },
    // Log build environment (safe check)
    ...(console.log('--- CI Environment Check ---'),
      console.log(`VITE_FIREBASE_API_KEY detected: ${!!env.VITE_FIREBASE_API_KEY}`),
      console.log(`VITE_FIREBASE_PROJECT_ID detected: ${!!env.VITE_FIREBASE_PROJECT_ID}`),
      console.log('-----------------------------'),
      {}),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
