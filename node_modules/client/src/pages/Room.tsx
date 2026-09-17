import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Crown, GameController, Robot, SignOut, WarningCircle, WifiHigh } from '@phosphor-icons/react';
import { gamesRegistry } from '@gamehub/shared';
import type { Player, Room as RoomState } from '@gamehub/shared';
import { useSocket } from '../hooks/useSocket';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { ClientGameRegistry } from '../games/ClientGameRegistry';

export function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { profile } = useSessionProfile();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [returning, setReturning] = useState(false);
  const leaveDialog = useRef<HTMLDialogElement>(null);
  const leaving = useRef(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const waitForRoom = () => {
      setJoined(false);
      setError('');
      setReturning(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => setError('The game is taking too long to respond. Try again or return to the arcade.'), 10000);
    };
    const join = () => {
      if (leaving.current) return;
      waitForRoom();
      socket.emit('join_room', { nickname: profile.nickname, avatarSeed: profile.avatarSeed, roomId });
    };
    const onRoomState = (data: RoomState) => {
      if (leaving.current || !socket.connected || data.id !== roomId?.toUpperCase() || !data.players.some(player => player.id === socket.id)) return;
      clearTimeout(timeout);
      setRoom({ ...data, players: [...new Map(data.players.map(player => [player.id, player])).values()] });
      setJoined(true);
      setError('');
      if (data.status === 'lobby') navigate(`/room/${data.id}`, { replace: true });
    };
    const onPlayerJoined = (player: Player) => {
      setRoom(prev => prev ? { ...prev, players: [...prev.players.filter(p => p.id !== player.id), player] } : prev);
    };
    const onPlayerLeft = (playerId: string) => {
      setRoom(prev => prev ? { ...prev, players: prev.players.filter(player => player.id !== playerId) } : prev);
    };
    const onHostMigrated = (hostId: string) => {
      setRoom(prev => prev ? { ...prev, hostId } : prev);
      setReturning(false);
    };
    const onError = (data: { message: string }) => {
      clearTimeout(timeout);
      setError(data.message || 'Something went wrong. Please try again.');
      setReturning(false);
    };
    const onDisconnect = () => {
      clearTimeout(timeout);
      setJoined(false);
      setReturning(false);
      setError('Connection lost. Your seat may no longer be available once a game has started.');
    };
    const onConnectError = () => {
      clearTimeout(timeout);
      setJoined(false);
      setReturning(false);
      setError('Could not reach the server. Check your connection and try again.');
    };
    socket.on('connect', join);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('room_state_update', onRoomState);
    socket.on('room_joined', onRoomState);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('host_migrated', onHostMigrated);
    socket.on('error', onError);
    if (socket.connected) join();
    else {
      waitForRoom();
      socket.connect();
    }
    return () => {
      clearTimeout(timeout);
      socket.off('connect', join);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('room_state_update', onRoomState);
      socket.off('room_joined', onRoomState);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('host_migrated', onHostMigrated);
      socket.off('error', onError);
    };
  }, [socket, profile.nickname, profile.avatarSeed, roomId, navigate, attempt]);

  useEffect(() => {
    if (!returning) return;
    const timeout = setTimeout(() => {
      setReturning(false);
      setError('The server did not confirm the return to lobby. Please try again.');
    }, 8000);
    return () => clearTimeout(timeout);
  }, [returning]);

  const leaveRoom = () => {
    leaving.current = true;
    leaveDialog.current?.close();
    socket.disconnect();
    navigate('/', { replace: true });
  };

  if (!room || !joined) {
    return (
      <div className="page-container flex flex-1 items-center justify-center py-12">
        <section className="panel w-full max-w-lg p-6 sm:p-10" aria-labelledby="game-loading-title" aria-busy={!error}>
          <GameController size={36} className="mb-8 text-emerald-400" aria-hidden="true" />
          <p className="eyebrow mb-3">Back to the action</p>
          <h1 id="game-loading-title" className="text-3xl font-semibold tracking-tight">{error ? 'The connection needs a hand.' : 'Getting your game ready…'}</h1>
          <p className="muted mt-4 leading-relaxed" role={error ? 'alert' : 'status'}>{error || `Connecting to room ${roomId?.toUpperCase() || ''}. Hang tight.`}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {error && <button className="btn btn-primary" onClick={() => setAttempt(value => value + 1)}>Try again</button>}
            <button className="btn btn-secondary" onClick={leaveRoom}><ArrowLeft size={18} aria-hidden="true" /> Back to arcade</button>
          </div>
        </section>
      </div>
    );
  }

  const game = gamesRegistry.find(game => game.id === room.gameId) ?? gamesRegistry.find(game => room.gameId === 'reaction' && game.id === 'reaction-rush');
  const GameComponent = room.gameId ? ClientGameRegistry[room.gameId] : undefined;
  const isHost = room.hostId === socket.id;
  const finished = room.status === 'results' || room.gameState?.status === 'finished' || room.gameState?.state?.phase === 'game_over';
  const showReturn = finished || !GameComponent;
  const returnToLobby = () => {
    if (!socket.connected || !joined || !isHost || returning) return;
    setReturning(true);
    setError('');
    socket.emit('back_to_lobby');
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="border-b border-slate-800 bg-slate-900/70">
        <div className="page-container py-4">
          <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
            <div className="flex min-w-0 items-center gap-4">
              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400 sm:flex"><GameController size={25} aria-hidden="true" /></div>
              <div className="min-w-0"><p className="eyebrow mb-1">{finished ? 'Round complete' : 'Now playing'}</p><h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{game?.name || 'Game room'}</h1></div>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-5">
              <span role="status" className="flex items-center gap-1.5 text-xs text-emerald-400"><WifiHigh size={17} aria-hidden="true" />{isConnected ? 'Connected' : 'Disconnected'}</span>
              <span className="font-mono text-sm tracking-widest text-slate-300"><span className="sr-only">Room code </span>{room.id}</span>
              <button className="btn btn-ghost" onClick={() => { if (finished) leaveRoom(); else leaveDialog.current?.showModal(); }}><SignOut size={18} aria-hidden="true" />Leave room</button>
            </div>
          </div>
          <ul aria-label="Players in this room" className="mt-4 flex flex-wrap gap-2 border-t border-slate-800 pt-3">
            {room.players.map(player => {
              const currentTurn = player.id === room.gameState?.state?.currentTurn && !finished;
              return (
                <li key={player.id} className={`flex min-w-0 max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs ${currentTurn ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-slate-800 bg-slate-950/40 text-slate-300'}`}>
                  {player.id.startsWith('bot_') ? <Robot size={16} className="shrink-0" aria-hidden="true" /> : <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden="true" />}
                  <span className="truncate" title={player.nickname}>{player.nickname}</span>
                  {player.id === socket.id && <span className="text-slate-400">(you)</span>}
                  {player.id.startsWith('bot_') && <span className="text-slate-400">Bot</span>}
                  {player.id === room.hostId && <><Crown size={14} className="shrink-0 text-emerald-400" aria-hidden="true" /><span className="sr-only">Host</span></>}
                  {currentTurn && <span className="shrink-0">Their turn</span>}
                </li>
              );
            })}
          </ul>
        </div>
      </header>

      {error && <div className="page-container pt-4"><p role="alert" className="flex items-start gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200"><WarningCircle size={20} className="shrink-0" aria-hidden="true" />{error}</p></div>}

      {showReturn && <section className="page-container pt-5" aria-label="Next round"><div className="panel flex flex-col justify-between gap-4 border-emerald-400/20 p-5 sm:flex-row sm:items-center"><div><p className="font-semibold">{finished ? 'Same people. Another round?' : 'Let’s head back to the lobby.'}</p><p role="status" className="muted mt-1 text-sm">{isHost ? 'Bring everyone back together. Ready states will reset.' : 'Waiting for the host to return everyone to the lobby.'}</p></div>{isHost && <button className="btn btn-primary shrink-0" disabled={!isConnected || returning} onClick={returnToLobby}>{returning ? 'Returning…' : 'Return to lobby'}<ArrowRight size={18} aria-hidden="true" /></button>}</div></section>}

      <div className="relative flex min-w-0 flex-1 flex-col bg-slate-950 py-6">
        {GameComponent ? <GameComponent room={room} socket={socket} /> : (
          <section className="page-container flex flex-1 flex-col items-center justify-center py-12 text-center" aria-labelledby="game-unavailable-title"><GameController size={40} className="mb-5 text-slate-500" aria-hidden="true" /><h2 id="game-unavailable-title" className="text-2xl font-semibold">{room.gameId ? 'This game is not available.' : 'No game selected.'}</h2><p className="muted mt-3 max-w-md leading-relaxed">Return to the lobby or leave this room to choose another game from the arcade.</p></section>
        )}
      </div>

      <dialog ref={leaveDialog} aria-labelledby="leave-room-title" aria-describedby="leave-room-description" className="panel fixed inset-0 m-auto w-[calc(100%_-_48px)] max-h-[calc(100dvh_-_48px)] overflow-y-auto max-w-md p-6 text-slate-100 shadow-2xl backdrop:bg-slate-950/80 sm:p-8">
        <SignOut size={30} className="mb-5 text-emerald-400" aria-hidden="true" />
        <h2 id="leave-room-title" className="text-2xl font-semibold tracking-tight">Leave this round?</h2>
        <p id="leave-room-description" className="muted mt-3 leading-relaxed">You’ll give up your seat and may not be able to rejoin while the game is in progress.{isHost ? ' Hosting passes to another player. If you’re the last person, the room closes.' : ' The other players will stay in the room.'}</p>
        <form method="dialog" className="mt-7 flex flex-col gap-3 sm:flex-row"><button autoFocus className="btn btn-secondary flex-1">Keep playing</button><button type="button" className="btn btn-primary flex-1" onClick={leaveRoom}>Leave room<ArrowRight size={18} aria-hidden="true" /></button></form>
      </dialog>
    </div>
  );
}
