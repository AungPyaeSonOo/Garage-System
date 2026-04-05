import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',   // ensures assets are loaded from root
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',   // forward API calls to backend during dev
      '/users': 'http://localhost:5000',
      '/customers': 'http://localhost:5000',
      '/vehicles': 'http://localhost:5000',
      '/services': 'http://localhost:5000',
      '/problems': 'http://localhost:5000',
      '/employees': 'http://localhost:5000',
      '/parts': 'http://localhost:5000',
      '/invoices': 'http://localhost:5000',
      '/invoice-services': 'http://localhost:5000',
      '/invoice-details': 'http://localhost:5000',
      '/sales-invoices': 'http://localhost:5000',
      '/dashboard': 'http://localhost:5000',
      '/custom-parts': 'http://localhost:5000'
    }
  }
})