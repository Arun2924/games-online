import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, CheckCircle, Copy, Crown, GameController, PaperPlaneTilt, QrCode, Robot, Users, WarningCircle, WifiHigh } from '@phosphor-icons/react';
import { gamesRegistry } from '@gamehub/shared';
import type { Player, Room } from '@gamehub/shared';
import { useSocket } from '../hooks/useSocket';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { QRCodeSVG } from 'qrcode.react';

const BOT_ID_PREFIX = 'bot_';
type ChatMessage = { id: number; author: string; text: string; time: string };

export function GameLobby() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { profile } = useSessionProfile();
  const [room, setRoom] = useState<Room | null>(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState<'ready' | 'start' | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showQr, setShowQr] = useState(false);
  const chatLog = useRef<HTMLDivElement>(null);
  const followChat = useRef(true);
  const leaveDialog = useRef<HTMLDialogElement>(null);
  const messageId = useRef(0);
  const activeRoomId = useRef<string | null>(null);
  const leaving = useRef(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const waitForRoom = () => {
      setJoined(false);
      setError('');
      setPending(null);
      clearTimeout(timeout);
      timeout = setTimeout(() => setError('The room is taking too long to respond. Try again or return to the arcade.'), 10000);
    };
    const join = () => {
      if (leaving.current) return;
      waitForRoom();
      socket.emit('join_room', { nickname: profile.nickname, avatarSeed: profile.avatarSeed, roomId });
    };
    const onRoomState = (data: Room) => {
      if (leaving.current || !socket.connected || data.id !== roomId?.toUpperCase() || !data.players.some(player => player.id === socket.id)) return;
      clearTimeout(timeout);
      if (activeRoomId.current !== data.id) {
        activeRoomId.current = data.id;
        followChat.current = true;
        setMessages([]);
        setChatInput('');
        setCopyStatus('idle');
        setShowQr(false);
      }
      setRoom({ ...data, players: [...new Map(data.players.map(player => [player.id, player])).values()] });
      setJoined(true);
      setError('');
      if (data.status !== 'lobby') navigate(`/room/${data.id}/play`, { replace: true });
    };
    const onPlayerJoined = (player: Player) => {
      setRoom(prev => prev ? { ...prev, players: [...prev.players.filter(p => p.id !== player.id), player] } : prev);
    };
    const onPlayerLeft = (playerId: string) => {
      setRoom(prev => prev ? { ...prev, players: prev.players.filter(p => p.id !== playerId) } : prev);
    };
    const onHostMigrated = (hostId: string) => {
      setRoom(prev => prev ? { ...prev, hostId } : prev);
    };
    const onReadyChanged = (data: { playerId: string; isReady: boolean }) => {
      setRoom(prev => prev ? { ...prev, players: prev.players.map(p => p.id === data.playerId ? { ...p, isReady: data.isReady } : p) } : prev);
      if (data.playerId === socket.id) setPending(null);
    };
    const onChatMessage = (msg: { author: string; text: string }) => {
      setMessages(prev => [...prev.slice(-199), { ...msg, id: ++messageId.current, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    };
    const onError = (data: { message: string }) => {
      clearTimeout(timeout);
      setError(data.message || 'Something went wrong. Please try again.');
      setPending(null);
    };
    const onDisconnect = () => {
      clearTimeout(timeout);
      setJoined(false);
      setPending(null);
      setError('Connection lost. Reconnecting may require joining the room again.');
    };
    const onConnectError = () => {
      clearTimeout(timeout);
      setJoined(false);
      setError('Could not reach the server. Check your connection and try again.');
    };
    socket.on('connect', join);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('room_joined', onRoomState);
    socket.on('room_state_update', onRoomState);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('host_migrated', onHostMigrated);
    socket.on('ready_changed', onReadyChanged);
    socket.on('chat_message', onChatMessage);
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
      socket.off('room_joined', onRoomState);
      socket.off('room_state_update', onRoomState);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('host_migrated', onHostMigrated);
      socket.off('ready_changed', onReadyChanged);
      socket.off('chat_message', onChatMessage);
      socket.off('error', onError);
    };
  }, [socket, profile.nickname, profile.avatarSeed, roomId, navigate, attempt]);

  useEffect(() => {
    if (chatLog.current && followChat.current) chatLog.current.scrollTop = chatLog.current.scrollHeight;
  }, [messages, joined]);

  useEffect(() => {
    if (!pending) return;
    const timeout = setTimeout(() => {
      setPending(null);
      setError('The server did not confirm that action. Please try again.');
    }, 8000);
    return () => clearTimeout(timeout);
  }, [pending]);

  useEffect(() => {
    if (copyStatus === 'idle') return;
    const timeout = setTimeout(() => setCopyStatus('idle'), 5000);
    return () => clearTimeout(timeout);
  }, [copyStatus]);

  const leaveRoom = () => {
    leaving.current = true;
    leaveDialog.current?.close();
    socket.disconnect();
    navigate('/', { replace: true });
  };

  if (!room || !joined) {
    return (
      <div className="page-container flex flex-1 items-center justify-center py-12">
        <section className="panel w-full max-w-lg p-6 sm:p-10" aria-labelledby="lobby-loading-title" aria-busy={!error}>
          <GameController size={36} className="mb-8 text-emerald-400" aria-hidden="true" />
          <p className="eyebrow mb-3">Your next round</p>
          <h1 id="lobby-loading-title" className="text-3xl font-semibold tracking-tight">{error ? 'Let’s get you connected.' : 'Opening your room…'}</h1>
          <p className="muted mt-4 leading-relaxed" role={error ? 'alert' : 'status'}>{error || `Connecting to room ${roomId?.toUpperCase() || ''}. Your seat will appear here shortly.`}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {error && <button className="btn btn-primary" onClick={() => setAttempt(value => value + 1)}>Try again</button>}
            <button className="btn btn-secondary" onClick={leaveRoom}><ArrowLeft size={18} aria-hidden="true" /> Back to arcade</button>
          </div>
        </section>
      </div>
    );
  }

  const game = gamesRegistry.find(game => game.id === room.gameId) ?? gamesRegistry.find(game => room.gameId === 'reaction' && game.id === 'reaction-rush');
  const me = room.players.find(player => player.id === socket.id);
  const isHost = room.hostId === socket.id;
  const readyCount = room.players.filter(player => player.isReady).length;
  const allReady = room.players.length > 0 && readyCount === room.players.length;
  const minPlayers = room.gameId === 'tictactoe' || room.gameId === 'rps' ? 2 : (game?.minPlayers ?? 1);
  const neededPlayers = Math.max(0, minPlayers - room.players.length);
  const hasBots = room.players.some(player => player.id.startsWith(BOT_ID_PREFIX));
  const gameAvailable = !!game && !game.isComingSoon;
  const canAct = isConnected && joined && room.status === 'lobby' && !!me && !pending;
  const canStart = canAct && isHost && allReady && neededPlayers === 0 && gameAvailable;
  const inviteUrl = `${window.location.origin}/join-room?code=${encodeURIComponent(room.id)}`;
  const guidance = !room.gameId
    ? 'No game is selected. Return to the arcade to create a new room.'
    : !gameAvailable
      ? 'This game is not available yet. Return to the arcade to choose another game.'
      : neededPlayers > 0
        ? `Invite ${neededPlayers} more ${neededPlayers === 1 ? 'player' : 'players'} to start. This game needs at least ${minPlayers}.`
        : !allReady
          ? 'Everyone needs to ready up before the host can start.'
          : isHost ? 'Everyone is ready. The next round is yours to start.' : 'Everyone is ready. Waiting for the host to start.';

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopyStatus('success');
    } catch {
      setCopyStatus('error');
    }
  };
  const sendChat = (event: FormEvent) => {
    event.preventDefault();
    if (!socket.connected || !joined || !me || !chatInput.trim()) return;
    followChat.current = true;
    socket.emit('send_chat', { text: chatInput.trim() });
    setChatInput('');
  };

  return (
    <div className="page-container flex-1 pb-12 pt-5 sm:pt-8">
      <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-sm">
        <button className="btn btn-ghost -ml-3" onClick={() => leaveDialog.current?.showModal()}><ArrowLeft size={17} aria-hidden="true" /> Arcade</button>
        <span className="text-slate-600" aria-hidden="true">/</span>
        <span className="text-slate-300" aria-current="page">Game lobby</span>
        <span className="ml-auto flex items-center gap-2 text-emerald-400"><WifiHigh size={17} aria-hidden="true" /> Connected</span>
      </nav>

      <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-3">{hasBots ? 'A little friendly competition' : 'Good company. Great games.'}</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{game?.name || 'Game lobby'}</h1>
          <p className="muted mt-3">{hasBots ? 'Your bot is ready. Take a seat and make your move.' : 'Gather your people. Get ready for the next round.'}</p>
        </div>
        {game && <p className="flex shrink-0 items-center gap-2 text-sm text-slate-400"><GameController size={20} aria-hidden="true" />{game.category}<span aria-hidden="true">/</span>{game.estimatedDuration}</p>}
      </header>

      {error && <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200"><WarningCircle size={20} className="shrink-0" aria-hidden="true" />{error}</div>}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <section className="panel overflow-hidden" aria-labelledby="players-heading">
            <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3"><Users size={23} className="text-emerald-400" aria-hidden="true" /><h2 id="players-heading" className="text-xl font-semibold">The lineup</h2></div>
              <span className="text-sm tabular-nums text-slate-400">{room.players.length} / {room.maxPlayers} players</span>
            </div>
            <ul className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
              {room.players.map(player => (
                <li key={player.id} className={`flex min-w-0 flex-wrap items-center gap-3 rounded-xl border p-4 ${player.id === socket.id ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-slate-800 bg-slate-950/40'}`}>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-lg font-semibold text-emerald-300" aria-hidden="true">
                    {player.id.startsWith(BOT_ID_PREFIX) ? <Robot size={25} /> : player.nickname.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-semibold text-slate-100">{player.nickname}{player.id === socket.id && <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      {player.id === room.hostId && <span className="inline-flex items-center gap-1"><Crown size={13} aria-hidden="true" />Host</span>}
                      {player.id.startsWith(BOT_ID_PREFIX) && <span>Bot</span>}
                      {player.id !== room.hostId && !player.id.startsWith(BOT_ID_PREFIX) && <span>Player</span>}
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-medium ${player.isReady ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {player.isReady && <CheckCircle size={16} weight="fill" aria-hidden="true" />}{player.isReady ? 'Ready' : 'Not ready'}
                  </span>
                </li>
              ))}
              {Array.from({ length: Math.max(0, room.maxPlayers - room.players.length) }, (_, index) => (
                <li key={`empty-${index}`} className="flex min-h-24 items-center gap-3 rounded-xl border border-dashed border-slate-700/70 px-4 py-5 text-slate-400">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-dashed border-slate-700" aria-hidden="true"><Users size={20} /></span>
                  <div><p className="text-sm">Open seat</p><p className="mt-1 text-xs text-slate-500">{hasBots ? 'Room for a friend' : 'Waiting for a friend'}</p></div>
                </li>
              ))}
            </ul>
            <div className="border-t border-slate-800 bg-slate-950/30 p-5 sm:p-7">
              <div className="mb-5 flex items-start gap-3">
                <CheckCircle size={22} className={`mt-0.5 shrink-0 ${allReady && !neededPlayers ? 'text-emerald-400' : 'text-slate-400'}`} aria-hidden="true" />
                <div aria-live="polite"><p className="font-medium">{readyCount} of {room.players.length} ready</p><p id="start-guidance" className="muted mt-1 text-sm leading-relaxed">{guidance}</p></div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button disabled={!canAct} aria-pressed={!!me?.isReady} className={`btn ${me?.isReady ? 'btn-secondary' : 'btn-primary'} sm:flex-1`} onClick={() => { if (!canAct || !socket.connected) return; setError(''); setPending('ready'); socket.emit('toggle_ready'); }}>
                  <Check size={19} aria-hidden="true" />{pending === 'ready' ? 'Updating…' : me?.isReady ? 'Unready' : 'I’m ready'}
                </button>
                {isHost && <button className="btn btn-primary sm:flex-1" disabled={!canStart} aria-describedby="start-guidance" onClick={() => { if (!canStart || !socket.connected) return; setError(''); setPending('start'); socket.emit('start_game'); }}>{pending === 'start' ? 'Starting…' : 'Start game'}<ArrowRight size={19} aria-hidden="true" /></button>}
              </div>
            </div>
          </section>

          <section className="panel p-5 sm:p-7" aria-labelledby="invite-heading">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <h2 id="invite-heading" className="eyebrow mb-3">Your room code</h2>
                <p className="select-all font-mono text-4xl font-semibold tracking-[0.16em] text-emerald-300 sm:text-5xl">{room.id}</p>
                <p className="muted mt-3 text-sm">Share the code. Save them a seat.</p>
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-col">
                <button className="btn btn-secondary" onClick={copyInvite}>{copyStatus === 'success' ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}{copyStatus === 'success' ? 'Link copied' : 'Copy invite link'}</button>
                <button className="btn btn-ghost" aria-expanded={showQr} aria-controls="invite-qr" onClick={() => setShowQr(value => !value)}><QrCode size={18} aria-hidden="true" />{showQr ? 'Hide QR code' : 'Invite with QR'}</button>
              </div>
            </div>
            <p role="status" className={`mt-3 text-sm ${copyStatus === 'error' ? 'text-rose-200' : 'text-emerald-400'}`}>{copyStatus === 'error' ? 'Could not copy the link. Share the room code above or use the QR code.' : copyStatus === 'success' ? 'Invite link copied to your clipboard.' : ''}</p>
            <div id="invite-qr" hidden={!showQr}>
              {showQr && <div className="mt-4 flex flex-col items-center gap-4 border-t border-slate-800 pt-5 sm:flex-row"><div className="shrink-0 rounded-xl bg-white p-3"><QRCodeSVG value={inviteUrl} size={136} title={`Scan to join room ${room.id}`} /></div><div><p className="font-medium">Same room. Any screen.</p><p className="muted mt-2 max-w-xs text-sm leading-relaxed">Scan with a phone camera to open the invitation and join this room.</p></div></div>}
            </div>
          </section>
        </div>

        <aside className="panel flex h-[460px] min-w-0 flex-col lg:h-[560px]" aria-labelledby="chat-heading">
          <div className="border-b border-slate-800 px-5 py-5"><h2 id="chat-heading" className="text-xl font-semibold">Room chat</h2><p className="muted mt-1 text-sm">A little pre-game conversation.</p></div>
          <div ref={chatLog} onScroll={event => { const log = event.currentTarget; followChat.current = log.scrollHeight - log.scrollTop - log.clientHeight < 48; }} role="log" aria-label="Room messages" aria-live="polite" aria-relevant="additions" tabIndex={0} className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain p-5 focus-visible:outline-2 focus-visible:outline-emerald-400">
            {messages.length === 0 ? <div className="my-auto text-center"><PaperPlaneTilt size={30} className="mx-auto mb-4 text-slate-500" aria-hidden="true" /><p className="text-sm font-medium text-slate-300">{hasBots ? 'The bot lets its moves do the talking.' : 'The room is quiet. Say hello.'}</p><p className="muted mt-2 text-xs">Messages stay here for this visit.</p></div> : messages.map(message => (
              <div key={message.id} className="min-w-0 text-sm"><div className="mb-1.5 flex items-baseline justify-between gap-3"><span className="min-w-0 break-words font-medium text-emerald-300">{message.author}</span><span className="shrink-0 text-xs tabular-nums text-slate-500">{message.time}</span></div><p className="whitespace-pre-wrap break-words leading-relaxed text-slate-200">{message.text}</p></div>
            ))}
          </div>
          <form onSubmit={sendChat} className="border-t border-slate-800 p-5">
            <label htmlFor="room-chat-message" className="field-label">Message the room</label>
            <div className="mt-2 flex gap-2"><input id="room-chat-message" type="text" value={chatInput} onChange={event => setChatInput(event.target.value)} placeholder="Say something nice…" className="field min-w-0 flex-1" maxLength={100} autoComplete="off" disabled={!isConnected || !me} /><button type="submit" className="btn btn-primary min-w-11 shrink-0 px-3" aria-label="Send message" disabled={!isConnected || !me || !chatInput.trim()}><PaperPlaneTilt size={19} aria-hidden="true" /></button></div>
          </form>
        </aside>
      </div>
      <dialog ref={leaveDialog} aria-labelledby="leave-lobby-title" aria-describedby="leave-lobby-description" className="panel fixed inset-0 m-auto w-[calc(100%_-_48px)] max-h-[calc(100dvh_-_48px)] max-w-md overflow-y-auto p-6 text-slate-100 shadow-2xl backdrop:bg-slate-950/80 sm:p-8">
        <h2 id="leave-lobby-title" className="text-2xl font-semibold tracking-tight">Leave this room?</h2>
        <p id="leave-lobby-description" className="muted mt-3 leading-relaxed">You’ll give up your seat.{isHost ? ' Hosting passes to another player. If you’re the last person, the room closes.' : ' The other players will stay in the room.'}</p>
        <form method="dialog" className="mt-7 flex flex-col gap-3 sm:flex-row"><button autoFocus className="btn btn-secondary flex-1">Stay in lobby</button><button type="button" className="btn btn-primary flex-1" onClick={leaveRoom}>Leave room<ArrowRight size={18} aria-hidden="true" /></button></form>
      </dialog>
    </div>
  );
}
