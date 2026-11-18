import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Ensure absolute asset paths for production domains
  base: '/',

  plugins: [
    react(),
    tailwindcss(),
  ],

  build: {
    // Prevent layout flickering by bundling all CSS into a single file
    cssCodeSplit: false,
    sourcemap: false,

    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('three') || id.includes('@react-three')) return 'vendor-three';
          if (id.includes('gsap')) return 'vendor-gsap';
          if (id.includes('framer-motion')) return 'vendor-framer';
          if (id.includes('firebase')) return 'vendor-firebase';

          if (
            id.includes('react-dom') ||
            id.includes('react-router') ||
            id.includes('react-helmet')
          ) {
            return 'vendor-react';
          }

          // Group remaining essential node_modules
          if (id.includes('node_modules')) {
            return 'vendor-lib';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
