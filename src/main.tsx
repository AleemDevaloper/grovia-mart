import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './auth/AuthProvider'
import './index.css'
import App from './App.tsx'
import { BrandLoader } from './components/BrandLoader'

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
})

const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/service-worker.js').catch((error: unknown) => {
      console.error('Grovia offline support could not be enabled.', error)
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <BrandLoader><App /></BrandLoader>
        </AuthProvider>
      </Router>
      <Analytics />
    </QueryClientProvider>
  </StrictMode>,
)
