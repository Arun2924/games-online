import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { ClientGameRegistry } from '../games/ClientGameRegistry';

export function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { profile } = useSessionProfile();
  const [room, setRoom] = useState<any>(null);

  useEffect(() => {
    if (isConnected) {
      socket.emit('join_room', {
        nickname: profile.nickname,
        avatarSeed: profile.avatarSeed,
        roomId
      });
    } else {
      socket.connect();
    }

    const onRoomState = (data: any) => {
      setRoom(data);
      if (data.status === 'lobby') {
        navigate(`/room/${data.id}`);
      }
    };

    socket.on('room_state_update', onRoomState);
    socket.on('room_joined', onRoomState);

    return () => {
      socket.off('room_state_update', onRoomState);
      socket.off('room_joined', onRoomState);
    };
  }, [socket, isConnected, profile, roomId, navigate]);

  if (!room) {
    return <div className="flex-1 flex items-center justify-center">Loading game...</div>;
  }

  const renderGame = () => {
    if (!room.gameId) return <div>No game selected</div>;
    
    const GameComponent = ClientGameRegistry[room.gameId];
    if (!GameComponent) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <div className="text-4xl mb-4">🚧</div>
          <h2 className="text-2xl font-bold text-white mb-2">Game Not Available</h2>
          <p>The game module "{room.gameId}" is either missing or still under construction.</p>
        </div>
      );
    }
    
    return <GameComponent room={room} socket={socket} />;
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Top Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {room.players.map((p: any) => (
              <div key={p.id} className="relative group">
                <img 
                  src={`https://api.dicebear.com/8.x/bottts/svg?seed=${p.avatarSeed}`} 
                  className={`w-8 h-8 rounded-full border-2 ${p.id === room.gameState?.state?.currentTurn ? 'border-emerald-500 scale-110 z-10' : 'border-slate-800'}`}
                  title={p.nickname}
                />
              </div>
            ))}
          </div>
          <div className="font-mono text-sm tracking-widest text-slate-400 bg-slate-950 px-2 py-1 rounded">
            {room.id}
          </div>
        </div>
        
        <div>
          <span className="font-bold uppercase tracking-wider text-sm">{room.gameId}</span>
        </div>
      </div>

      {/* Center Game */}
      <div className="flex-1 overflow-hidden flex flex-col relative bg-slate-950">
        {renderGame()}
      </div>
    </div>
  );
}
