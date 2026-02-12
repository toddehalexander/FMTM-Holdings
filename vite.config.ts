import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Replace 'YOUR_REPO_NAME' with your actual repository name
  // Example: If your repo is https://github.com/user/etf-tracker, use '/etf-tracker/'
  base: '/FMTM-Holdings/', 
});
