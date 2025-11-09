import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
    },
  },
  server: {
    port: 3001,
    host: true, // Allow external connections (for Docker)
    proxy: {
      '/api': {
        target: 'http://portfolio_app:3000',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://portfolio_app:3000',
        changeOrigin: true,
        secure: false,
      }
    },
    watch: {
      // Use polling for Docker compatibility
      usePolling: true,
      interval: 1000,
      ignored: ['**/node_modules/**', '**/dist/**', '**/.eslintrc.cjs', '**/coverage/**']
    }
  },
  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          charts: ['recharts'],
          router: ['react-router-dom'],
          forms: ['react-hook-form', '@hookform/resolvers', 'yup'],
          query: ['react-query'],
        },
      },
    },
  },
  preview: {
    port: 3001,
    host: true,
  },
  define: {
    // Define environment variables for production builds
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
})
