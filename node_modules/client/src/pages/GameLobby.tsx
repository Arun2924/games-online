import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { QRCodeSVG } from 'qrcode.react';

const BOT_ID_PREFIX = 'bot_';

export function GameLobby() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { profile } = useSessionProfile();
  
  const [room, setRoom] = useState<any>(null);
  const [messages, setMessages] = useState<{ id: string; author: string; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  
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
      if (data.status === 'playing') {
        navigate(`/room/${data.id}/play`);
      }
    };

    const onPlayerJoined = (player: any) => {
      setRoom((prev: any) => {
        if (!prev) return prev;
        return { ...prev, players: [...prev.players, player] };
      });
    };

    const onPlayerLeft = (playerId: string) => {
      setRoom((prev: any) => {
        if (!prev) return prev;
        return { ...prev, players: prev.players.filter((p: any) => p.id !== playerId) };
      });
    };

    const onHostMigrated = (hostId: string) => {
      setRoom((prev: any) => {
        if (!prev) return prev;
        return { ...prev, hostId };
      });
    };

    const onReadyChanged = (data: { playerId: string; isReady: boolean }) => {
      setRoom((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((p: any) => 
            p.id === data.playerId ? { ...p, isReady: data.isReady } : p
          )
        };
      });
    };

    const onChatMessage = (msg: { author: string; text: string }) => {
      setMessages(prev => [...prev, { id: Math.random().toString(), time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), ...msg }]);
    };
    
    const onError = (data: { message: string }) => {
      alert(`Error: ${data.message}`);
    };
    
    socket.on('room_joined', onRoomState);
    socket.on('room_state_update', onRoomState);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('host_migrated', onHostMigrated);
    socket.on('ready_changed', onReadyChanged);
    socket.on('chat_message', onChatMessage);
    socket.on('error', onError);
    
    return () => {
      socket.off('room_joined', onRoomState);
      socket.off('room_state_update', onRoomState);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('host_migrated', onHostMigrated);
      socket.off('ready_changed', onReadyChanged);
      socket.off('chat_message', onChatMessage);
      socket.off('error', onError);
    };
  }, [socket, isConnected, profile, roomId, navigate]);

  if (!room) {
    return <div className="flex-1 flex items-center justify-center">Loading room…</div>;
  }

  const me = room.players.find((p: any) => p.id === socket.id);
  const isHost = room.hostId === socket.id;
  const allReady = room.players.every((p: any) => p.isReady);
  const hasBots = room.players.some((p: any) => p.id.startsWith(BOT_ID_PREFIX));
  const inviteUrl = `${window.location.origin}/join-room?code=${room.id}`;

  const toggleReady = () => {
    socket.emit('toggle_ready');
  };

  const startGame = () => {
    if (isHost && allReady) {
      socket.emit('start_game');
    }
  };

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      socket.emit('send_chat', { text: chatInput.trim() });
      setChatInput('');
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 flex flex-col lg:flex-row gap-6">
      {/* Main Lobby Area */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              {hasBots ? 'Solo Game' : 'Room'}{' '}
              <span className="text-emerald-400 tracking-widest font-mono">{room.id}</span>
            </h1>
            <p className="text-slate-400">Game: <span className="text-white font-medium capitalize">{room.gameId || 'Not selected'}</span></p>
          </div>
          {!hasBots && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => { navigator.clipboard.writeText(inviteUrl); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm transition-colors"
              >
                Copy Link
              </button>
            </div>
          )}
        </div>

        {/* Players List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex-1">
          <h2 className="text-xl font-bold mb-4">Players ({room.players.length}/{room.maxPlayers})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {room.players.map((player: any) => {
              const isPlayerBot = player.id.startsWith(BOT_ID_PREFIX);
              return (
                <div key={player.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={`https://api.dicebear.com/8.x/bottts/svg?seed=${player.avatarSeed}`} alt="Avatar" className="w-10 h-10 rounded-full bg-slate-800" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{player.nickname}</span>
                        {isPlayerBot && (
                          <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded uppercase tracking-wider font-bold">Bot</span>
                        )}
                        {player.id === room.hostId && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded uppercase tracking-wider font-bold">Host</span>
                        )}
                        {player.id === socket.id && (
                          <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded uppercase tracking-wider font-bold">You</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    {player.isReady ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-sm font-bold">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        READY
                      </span>
                    ) : (
                      <span className="text-slate-500 text-sm font-medium">Not Ready</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
          <button 
            onClick={toggleReady}
            className={`px-8 py-3 rounded-xl font-bold transition-all active:scale-95 ${me?.isReady ? 'bg-slate-700 text-white' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'}`}
          >
            {me?.isReady ? 'Cancel Ready' : 'Ready Up'}
          </button>
          
          {isHost && (
            <button 
              onClick={startGame}
              disabled={!allReady}
              className="px-8 py-3 rounded-xl font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all active:scale-95 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500"
            >
              Start Game
            </button>
          )}
        </div>
        
      </div>

      {/* Sidebar: Chat & QR */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        
        {/* QR Code — hide in solo mode */}
        {!hasBots && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Scan to Join</h3>
            <div className="bg-white p-3 rounded-xl">
              <QRCodeSVG value={inviteUrl} size={160} />
            </div>
          </div>
        )}

        {/* Chat */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-96">
          <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Room Chat</h3>
          
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-4 pr-2">
            {messages.length === 0 ? (
              <div className="text-center text-slate-500 text-sm my-auto">
                {hasBots ? 'Ready up and start playing!' : 'Say hello!'}
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="text-sm break-words">
                  <span className="text-slate-500 text-[10px] mr-2">{msg.time}</span>
                  <span className="font-bold text-emerald-400 mr-2">{msg.author}:</span>
                  <span className="text-slate-200">{msg.text}</span>
                </div>
              ))
            )}
          </div>
          
          <form onSubmit={sendChat} className="flex gap-2">
            <input 
              type="text" 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Message…"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              maxLength={100}
            />
            <button type="submit" className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
