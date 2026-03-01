import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const gatewayTarget = process.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';
  const dealsTarget = process.env.VITE_DEALS_API_URL || 'http://localhost:8086';

  if (command === 'serve') {
    console.info(`[vite:start] mode=${mode} gateway=${gatewayTarget} deals=${dealsTarget}`);
  }

  return {
    plugins: [react()],
    appType: 'spa',
    server: {
      host: true,
      port: 3000,
      allowedHosts: ['garth-clannish-michelle.ngrok-free.dev'],
      open: true,
      proxy: {
        '/users': {
          target: gatewayTarget,
          changeOrigin: true
        },
        '/auth': {
          target: gatewayTarget,
          changeOrigin: true
        },
        '/otp': {
          target: gatewayTarget,
          changeOrigin: true
        },
        '/bookings': {
          target: gatewayTarget,
          changeOrigin: true
        },
        '/quotations': {
          target: gatewayTarget,
          changeOrigin: true
        },
        '/centres': {
          target: gatewayTarget,
          changeOrigin: true
        },
        '/payments': {
          target: gatewayTarget,
          changeOrigin: true
        },
        '/support': {
          target: gatewayTarget,
          changeOrigin: true
        },
        '/chat': {
          target: gatewayTarget,
          changeOrigin: true
        },
        '/agent-chat': {
          target: gatewayTarget,
          changeOrigin: true
        },
        '/tickets': {
          target: gatewayTarget,
          changeOrigin: true
        },
        '/memberships': {
          target: gatewayTarget,
          changeOrigin: true
        },
        '/rates': {
          target: gatewayTarget,
          changeOrigin: true
        },
        '/carwashrates': {
          target: gatewayTarget,
          changeOrigin: true
        },
        '/coupons': {
          target: gatewayTarget,
          changeOrigin: true,
          secure: false
        },
        '/api': {
          target: dealsTarget,
          changeOrigin: true
        }
      }
    }
  };
});
