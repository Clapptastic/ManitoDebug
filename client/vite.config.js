import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dynamic port configuration
const getPortConfig = () => {
  // Try to get from environment variables first
  const serverPort = process.env.VITE_SERVER_PORT || process.env.SERVER_PORT || 3000;
  const clientPort = process.env.VITE_CLIENT_PORT || process.env.CLIENT_PORT || 5173;
  
  return {
    server: parseInt(serverPort),
    client: parseInt(clientPort)
  };
};

const portConfig = getPortConfig();

export default defineConfig({
  plugins: [react()],
  server: {
    port: portConfig.client,
    host: true,
    proxy: {
      '/api': {
        target: `http://localhost:${portConfig.server}`,
        changeOrigin: true,
        secure: false
      }
    }
  },
  define: {
    __PORT_CONFIG__: JSON.stringify(portConfig)
  }
});