import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Updated to match your actual GitHub repository name
  base: '/FMTM-Holdings/', 
});