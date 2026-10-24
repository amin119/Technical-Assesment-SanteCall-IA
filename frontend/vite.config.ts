import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    // In dev, the browser talks to Vite and Vite forwards /api to FastAPI: no CORS needed,
    // and the code uses the same relative URLs as in production (nginx does the same job).
    proxy: { '/api': 'http://localhost:8000' },
  },
  test: { environment: 'node' },
})
