import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5174,
    open: true
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          chartjs: ['chart.js'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
});
