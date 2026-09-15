import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useSocket } from '../hooks/useSocket';
import { gamesRegistry } from '@gamehub/shared';

export function CreateRoom() {
  const { profile, updateProfile } = useSessionProfile();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [nickname, setNickname] = useState(profile.nickname);
  const [gameId, setGameId] = useState(location.state?.gameId || 'tictactoe');
  const isSolo = location.state?.solo === true;

  useEffect(() => {
    if (!isConnected) {
      socket.connect();
    }
  }, [isConnected, socket]);

  useEffect(() => {
    const onRoomCreated = (room: any) => {
      navigate(`/room/${room.id}`);
    };

    socket.on('room_created', onRoomCreated);
    return () => {
      socket.off('room_created', onRoomCreated);
    };
  }, [socket, navigate]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      updateProfile({ nickname: nickname.trim() });
      socket.emit('create_room', {
        nickname: nickname.trim(),
        avatarSeed: profile.avatarSeed,
        gameId,
        maxPlayers: 6,
        solo: isSolo
      });
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-3xl font-bold mb-2 text-center">
          {isSolo ? 'Play Solo' : 'Create Room'}
        </h2>
        {isSolo && (
          <p className="text-center text-slate-400 text-sm mb-6">You'll play against an AI bot</p>
        )}
        
        <form onSubmit={handleCreate} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="nickname" className="text-sm font-medium text-slate-400">Your Nickname</label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Enter nickname…"
              maxLength={15}
              required
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="game" className="text-sm font-medium text-slate-400">Select Game</label>
            <select
              id="game"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
              style={{ backgroundColor: '#020617', color: '#fff' }}
            >
              {gamesRegistry.map(game => (
                <option key={game.id} value={game.id}>{game.name}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit"
            disabled={!isConnected}
            className="w-full bg-emerald-500 text-slate-950 py-4 rounded-xl font-bold text-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 active:scale-95 mt-4"
          >
            {!isConnected ? 'Connecting…' : isSolo ? 'Start Game' : 'Create & Join'}
          </button>
        </form>
      </div>
    </div>
  );
}
