import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  if (mode === 'production') {
    const apiUrl = env.VITE_API_URL?.trim()
    let parsedApiUrl: URL | undefined

    try {
      parsedApiUrl = apiUrl ? new URL(apiUrl) : undefined
    } catch {
      throw new Error('VITE_API_URL must be a valid HTTPS URL to the Laravel API, ending in /api.')
    }

    if (
      !parsedApiUrl
      || parsedApiUrl.protocol !== 'https:'
      || ['localhost', '127.0.0.1', '::1'].includes(parsedApiUrl.hostname)
      || !parsedApiUrl.pathname.replace(/\/$/, '').endsWith('/api')
    ) {
      throw new Error('Set VITE_API_URL to the production Laravel API over HTTPS, ending in /api.')
    }
  }

  return {
    base: './',
    plugins: [react()],
  }
})
