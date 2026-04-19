import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gatewayTarget = env.VITE_API_GATEWAY_URL || 'http://localhost:8080';
  const authTarget = env.VITE_AUTH_API_URL || gatewayTarget;
  const dealsTarget = env.VITE_DEALS_API_URL || 'http://localhost:8086';
  const devPort = Number(env.VITE_DEV_PORT || 3000);
  const allowedHosts = (env.VITE_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);

  if (command === 'serve') {
    console.info(`[vite:start] mode=${mode} gateway=${gatewayTarget} auth=${authTarget} deals=${dealsTarget}`);
  }

  return {
    plugins: [react()],
    appType: 'spa',
    server: {
      host: true,
      port: devPort,
      allowedHosts: allowedHosts.length > 0 ? allowedHosts : true,
      open: true,
      proxy: {
        '/users': {
          target: authTarget,
          changeOrigin: true
        },
        '/auth': {
          target: authTarget,
          changeOrigin: true
        },
        '/otp': {
          target: authTarget,
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
          changeOrigin: true,
          bypass: (req) => {
            const acceptHeader = req.headers?.accept || '';
            if (typeof acceptHeader === 'string' && acceptHeader.includes('text/html')) {
              return '/index.html';
            }
            return undefined;
          }
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
          changeOrigin: true
        },
        '/deal-prices': {
          target: dealsTarget,
          changeOrigin: true
        },
        '/services': {
          target: dealsTarget,
          changeOrigin: true
        }
      }
    }
  };
});
