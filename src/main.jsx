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
            background: '#171A24',
            color: '#ECEAE5',
            border: '1px solid #222640',
            fontSize: '13px',
            borderRadius: '10px',
          },
          success: {
            iconTheme: { primary: '#34D399', secondary: '#0A0C10' },
          },
          error: {
            iconTheme: { primary: '#F87171', secondary: '#0A0C10' },
          },
        }}
      />
    </TenantProvider>
  </React.StrictMode>,
)
