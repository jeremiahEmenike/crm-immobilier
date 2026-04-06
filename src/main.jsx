import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { TenantProvider } from './hooks/useData'
import { Toaster } from 'react-hot-toast'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TenantProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#1d1d1f',
            border: '1px solid #d2d2d7',
            fontSize: '13px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          },
          success: {
            iconTheme: { primary: '#34C759', secondary: '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#FF3B30', secondary: '#ffffff' },
          },
        }}
      />
    </TenantProvider>
  </React.StrictMode>,
)
