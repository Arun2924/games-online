import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useSocket } from '../hooks/useSocket';

export function JoinRoom() {
  const { profile, updateProfile } = useSessionProfile();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [nickname, setNickname] = useState(profile.nickname);
  const [roomId, setRoomId] = useState(searchParams.get('code') || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isConnected) {
      socket.connect();
    }
  }, [isConnected, socket]);

  useEffect(() => {
    const onRoomJoined = (room: any) => {
      navigate(`/room/${room.id}`);
    };

    const onError = (data: { message: string }) => {
      setError(data.message);
    };

    socket.on('room_joined', onRoomJoined);
    socket.on('error', onError);
    
    return () => {
      socket.off('room_joined', onRoomJoined);
      socket.off('error', onError);
    };
  }, [socket, navigate]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (nickname.trim() && roomId.trim()) {
      updateProfile({ nickname: nickname.trim() });
      socket.emit('join_room', {
        nickname: nickname.trim(),
        avatarSeed: profile.avatarSeed,
        roomId: roomId.trim().toUpperCase()
      });
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-center">Join Room</h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="nickname" className="text-sm font-medium text-slate-400">Your Nickname</label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Enter nickname..."
              maxLength={15}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="roomId" className="text-sm font-medium text-slate-400">Room Code</label>
            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors uppercase tracking-widest font-mono"
              placeholder="XXXXXX"
              maxLength={6}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={!isConnected}
            className="w-full bg-slate-800 text-white border border-slate-700 py-4 rounded-xl font-bold text-lg hover:bg-slate-700 transition-colors disabled:opacity-50 active:scale-95 mt-4"
          >
            {isConnected ? 'Join Room' : 'Connecting...'}
          </button>
        </form>
      </div>
    </div>
  );
}
