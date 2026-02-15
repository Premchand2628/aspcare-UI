import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  server: {
    host: true,
    port: 3000,
    allowedHosts: [
  'garth-clannish-michelle.ngrok-free.dev'
],

    open: true,
    proxy: {
      // All API calls go through the gateway service on port 8080
      '/users': {
        target: 'http://192.168.1.233:8080',
        changeOrigin: true
      },
      '/auth': {
        target: 'http://192.168.1.233:8080',
        changeOrigin: true
      },
      '/otp': {
        target: 'http://192.168.1.233:8080',
        changeOrigin: true
      },
      '/bookings': {
        target: 'http://192.168.1.233:8080',
        changeOrigin: true
      },
      '/quotations': {
        target: 'http://192.168.1.233:8080',
        changeOrigin: true
      },
      '/centres': {
        target: 'http://192.168.1.233:8080',
        changeOrigin: true
      },
      '/payments': {
        target: 'http://192.168.1.233:8080',
        changeOrigin: true
      },
      '/support': {
        target: 'http://192.168.1.233:8080',
        changeOrigin: true
      },
      '/chat': {
        target: 'http://192.168.1.233:8080',
        changeOrigin: true
      },
      '/agent-chat': {
        target: 'http://192.168.1.233:8080',
        changeOrigin: true
      },
      '/tickets': {
        target: 'http://192.168.1.233:8080',
        changeOrigin: true
      },
      '/memberships': {
        target: 'http://192.168.1.233:8080',
        changeOrigin: true
      },
      '/rates': {
        target: 'http://192.168.1.233:8080',
        changeOrigin: true
      },
      '/carwashrates': {
        target: 'http://192.168.1.233:8080',
        changeOrigin: true
      },
      '/coupons': {
        target: 'http://192.168.1.233:8080',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://192.168.1.233:8086',
        changeOrigin: true
      }
    }
  }
});
