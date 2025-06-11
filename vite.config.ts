import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
  build: {
    // Optimize for Cloudflare Pages
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
    minify: 'terser', // Use terser for better minification
    target: 'es2020', // Modern browser support
    rollupOptions: {
      output: {
        // Code splitting for better caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', 'sonner'],
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  // Ensure proper base path for Cloudflare Pages
  base: './',
  // Preview server configuration
  preview: {
    port: 3000,
    host: true
  },
  // Development server configuration
  server: {
    port: 5173,
    host: true,
    // Handle client-side routing during development
    historyApiFallback: true
  },
  // Environment variables prefix
  envPrefix: 'VITE_',
  // CSS configuration
  css: {
    postcss: './postcss.config.js',
  },
  // Ensure imports work correctly
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})