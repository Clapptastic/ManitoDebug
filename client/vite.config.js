import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { getPortConfig } from '../server/config/ports.js';

export default defineConfig(async ({ mode }) => {
  // Get port configuration
  let portConfig;
  try {
    portConfig = await getPortConfig(mode || 'development');
  } catch (error) {
    console.warn('⚠️  Could not get port config, using defaults:', error);
    portConfig = {
      client: process.env.CLIENT_PORT || 5173,
      server: process.env.PORT || 3000
    };
  }

  return {
    plugins: [react()],
    server: {
      port: portConfig.client,
      host: true,
      proxy: {
        '/api': {
          target: `http://localhost:${portConfig.server}`,
          changeOrigin: true,
          secure: false
        },
        '/ws': {
          target: `ws://localhost:${portConfig.server}`,
          ws: true,
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-toast']
          }
        }
      }
    },
    define: {
      __PORT_CONFIG__: JSON.stringify(portConfig)
    }
  };
});