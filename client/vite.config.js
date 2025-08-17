import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dynamic port configuration using environment variables
const getPortConfig = () => {
  // Use dynamic port manager environment variables
  const serverPort = process.env.SERVER_PORT || process.env.PORT || 3000;
  const clientPort = process.env.CLIENT_PORT || 5173;
  
  // If dynamic ports are enabled, use the configured ranges
  if (process.env.ENABLE_DYNAMIC_PORTS === 'true') {
    const clientRangeStart = process.env.CLIENT_PORT_RANGE_START || 3000;
    const clientRangeEnd = process.env.CLIENT_PORT_RANGE_END || 3999;
    
    // Use the first available port in the range
    return {
      server: parseInt(serverPort),
      client: parseInt(clientRangeStart)
    };
  }
  
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