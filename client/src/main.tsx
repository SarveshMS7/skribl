import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'
import { SocketProvider } from './context/Socketcontext.tsx'

createRoot(document.getElementById('root')!).render(
  
    <SocketProvider>
      <App />
    </SocketProvider>
)
