import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App'
import { SocketProvider } from './context/SocketContext'
import { GameStoreProvider } from './store/useGameStore'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SocketProvider>
      <GameStoreProvider>
        <App />
      </GameStoreProvider>
    </SocketProvider>
  </StrictMode>
)
