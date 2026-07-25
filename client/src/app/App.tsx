import { useGameStore } from '../store/useGameStore';
import { useSocketEvents } from '../hooks/useSocketEvents';
import HomeScreen from '../components/screens/HomeScreen';
import LobbyScreen from '../components/screens/LobbyScreen';
import GameScreen from '../components/screens/GameScreen';
import EndScreen from '../components/screens/EndScreen';

function App() {
  const { screen, toast } = useGameStore();

  // Subscribe to all socket events
  useSocketEvents();

  return (
    <>
      {/* Toast notifications */}
      {toast && (
        <div className={`toast toast--${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Screen router */}
      {screen === 'home' && <HomeScreen />}
      {screen === 'lobby' && <LobbyScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'end' && <EndScreen />}
    </>
  );
}

export default App;
