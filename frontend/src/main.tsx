import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1A0A2E',
            color: '#fff',
            border: '1px solid rgba(147,51,234,0.4)',
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
          },
          success: { iconTheme: { primary: '#9333EA', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#EC4899', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  </StrictMode>
)
