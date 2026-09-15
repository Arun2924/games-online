import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CreateRoom } from './pages/CreateRoom';
import { JoinRoom } from './pages/JoinRoom';
import { Room } from './pages/Room';
import { GameLobby } from './pages/GameLobby';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="create-room" element={<CreateRoom />} />
        <Route path="join-room" element={<JoinRoom />} />
        <Route path="room/:roomId" element={<GameLobby />} />
        <Route path="room/:roomId/play" element={<Room />} />
      </Route>
    </Routes>
  );
}

export default App;
