import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        host: '0.0.0.0',
        port: 5173,
        allowedHosts: [
          'localhost',
          '127.0.0.1',
          '0.0.0.0',
          '.replit.dev',
          'fb087e37-ca7a-4ae7-9d62-d76df8de099f-00-39h6j0ug50ruj.sisko.replit.dev'
        ]
      }
    };
});
