import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, GameController, LinkSimple, Robot, Users, WifiHigh } from '@phosphor-icons/react';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useSocket } from '../hooks/useSocket';
import { gamesRegistry, type Room } from '@gamehub/shared';

export function CreateRoom() {
  const { profile, updateProfile } = useSessionProfile();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const isSolo = location.state?.solo === true;
  const availableGames = gamesRegistry.filter(game => !game.isComingSoon && game.supportedModes.includes(isSolo ? 'Solo' : 'Online'));
  const [nickname, setNickname] = useState(profile.nickname);
  const [gameId, setGameId] = useState<string>(() => availableGames.find(game => game.id === location.state?.gameId)?.id || availableGames[0]?.id || '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const nicknameInput = useRef<HTMLInputElement>(null);
  const responseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedGame = availableGames.find(game => game.id === gameId) || availableGames[0];

  useEffect(() => {
    const clearPending = () => {
      if (responseTimer.current !== null) clearTimeout(responseTimer.current);
      responseTimer.current = null;
      setPending(false);
    };
    const onRoomCreated = (room: Room) => {
      if (responseTimer.current === null) return;
      clearPending();
      navigate(`/room/${room.id}`);
    };
    const onError = (data: { message: string }) => {
      if (responseTimer.current === null) return;
      clearPending();
      setError(data.message || 'Your room could not be created. Please try again.');
    };
    const onDisconnect = () => {
      if (responseTimer.current === null) return;
      clearPending();
      setError('Connection interrupted. Once reconnected, try creating your room again.');
    };
    socket.on('room_created', onRoomCreated);
    socket.on('error', onError);
    socket.on('disconnect', onDisconnect);
    if (!socket.connected) socket.connect();
    return () => {
      socket.off('room_created', onRoomCreated);
      socket.off('error', onError);
      socket.off('disconnect', onDisconnect);
      if (responseTimer.current !== null) clearTimeout(responseTimer.current);
      responseTimer.current = null;
    };
  }, [socket, navigate]);

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (responseTimer.current !== null) return;
    setError('');
    setNicknameError('');
    if (!nickname.trim() || nickname.trim().length > 15) {
      setNicknameError('Choose a nickname between 1 and 15 characters.');
      nicknameInput.current?.focus();
      return;
    }
    if (!socket.connected) {
      setError('Connect to the game server before creating a room. Check your internet connection and retry.');
      socket.connect();
      return;
    }
    if (!selectedGame) {
      setError('No games are available for this mode yet. Try another mode from the arcade.');
      return;
    }
    updateProfile({ nickname: nickname.trim() });
    setPending(true);
    responseTimer.current = setTimeout(() => {
      responseTimer.current = null;
      setPending(false);
      setError('The server did not respond in time. Check your connection and try again.');
    }, 12000);
    socket.emit('create_room', {
      nickname: nickname.trim(),
      avatarSeed: profile.avatarSeed,
      gameId: selectedGame.id,
      maxPlayers: selectedGame.maxPlayers,
      solo: isSolo
    });
  };

  const steps = isSolo
    ? [
      { icon: GameController, title: 'Find your game', detail: 'A quick classic or a fresh challenge.' },
      { icon: Robot, title: 'Meet your opponent', detail: 'A bot joins your lobby, ready when you are.' },
      { icon: Check, title: 'Ready, set, play', detail: 'Ready up in the lobby to start your round.' }
    ]
    : [
      { icon: GameController, title: 'Pick the first game', detail: 'Set the mood for your next friendly rivalry.' },
      { icon: LinkSimple, title: 'Send the invite', detail: 'Share your room code or link with your people.' },
      { icon: Users, title: 'Get everyone together', detail: 'Ready up in the lobby, then let the games begin.' }
    ];

  return (
    <div className="page-container flex-1 py-8 sm:py-12 lg:py-16">
      <Link to="/" className="btn btn-ghost mb-8 w-fit text-sm text-slate-400 hover:text-white sm:mb-12">
        <ArrowLeft size={18} aria-hidden="true" /> Back to arcade
      </Link>
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <section className="lg:pt-5" aria-labelledby="create-title">
          <p className="eyebrow mb-5">{isSolo ? 'A little time for yourself' : 'Good games. Better company.'}</p>
          <h1 id="create-title" className="max-w-lg text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            {isSolo ? <>Your next<br /><span className="text-emerald-400">personal best.</span></> : <>Your room.<br /><span className="text-emerald-400">Your people.</span></>}
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-slate-400 sm:text-lg">
            {isSolo ? 'Take a breather, pick a game, and sharpen your skills. No waiting for the group chat.' : 'Make a little space for a good time. Pick a game and bring your friends along.'}
          </p>
          <ol className="mt-10 hidden max-w-md divide-y divide-slate-800 sm:block lg:mt-14">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4 py-5 first:pt-0">
                <step.icon size={24} weight="duotone" className="mt-1 shrink-0 text-emerald-400" aria-hidden="true" />
                <div className="flex-1">
                  <h2 className="text-base font-medium">{step.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{step.detail}</p>
                </div>
                <span className="pt-1 font-mono text-xs text-slate-500" aria-hidden="true">0{index + 1}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel min-w-0 p-6 sm:p-8 lg:p-10" aria-labelledby="setup-title">
          <div className="mb-8 flex items-start justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <p className="eyebrow mb-2">{isSolo ? 'Solo session' : 'Room setup'}</p>
              <h2 id="setup-title" className="text-2xl font-medium">{isSolo ? 'Make it your moment' : 'Start something fun'}</h2>
            </div>
            {isSolo ? <Robot size={28} weight="duotone" className="shrink-0 text-emerald-400" aria-hidden="true" /> : <Users size={28} weight="duotone" className="shrink-0 text-emerald-400" aria-hidden="true" />}
          </div>
          <form onSubmit={handleCreate} noValidate className="space-y-7" aria-busy={pending}>
            <div>
              <label htmlFor="nickname" className="field-label">Your nickname <span className="text-slate-500">(required)</span></label>
              <input
                ref={nicknameInput}
                id="nickname"
                name="nickname"
                type="text"
                value={nickname}
                onChange={event => { setNickname(event.target.value); setNicknameError(''); }}
                className="field mt-2 min-h-12 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                placeholder="What should we call you?"
                maxLength={15}
                required
                autoComplete="nickname"
                disabled={pending}
                aria-invalid={!!nicknameError}
                aria-describedby="nickname-help"
              />
              <p id="nickname-help" className={`mt-2 text-xs ${nicknameError ? 'text-red-400' : 'text-slate-400'}`} aria-live="polite">
                {nicknameError || 'Your name in the lobby. Keep it to 15 characters.'}
              </p>
            </div>
            <fieldset disabled={pending} className="min-w-0">
              <legend className="field-label mb-3">Choose your game</legend>
              <div className="space-y-2">
                {availableGames.map(game => (
                  <label key={game.id} className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-400 ${selectedGame?.id === game.id ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-slate-800 bg-slate-950/40 hover:border-slate-600'} ${pending ? 'cursor-wait opacity-60' : ''}`}>
                    <input type="radio" name="game" value={game.id} checked={selectedGame?.id === game.id} onChange={() => setGameId(game.id)} className="h-4 w-4 shrink-0 accent-emerald-400" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{game.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-400">{game.category} · {isSolo ? 'Solo + bot' : `Up to ${game.maxPlayers} players`}</span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">{game.estimatedDuration}</span>
                  </label>
                ))}
              </div>
              {availableGames.length === 0 && <p className="text-sm text-slate-400">No games available for this mode yet.</p>}
            </fieldset>
            <div className="space-y-4 border-t border-slate-800 pt-6">
              <div role="status" className="flex items-center gap-2 text-xs text-slate-400">
                <WifiHigh size={16} className={isConnected ? 'text-emerald-400' : 'text-slate-500'} aria-hidden="true" />
                {isConnected ? 'Connected · Ready when you are' : 'Connecting to the game server…'}
              </div>
              {!isConnected && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <p>Taking a while? Check your internet connection.</p>
                  <button type="button" onClick={() => socket.connect()} className="btn btn-ghost text-emerald-400">Retry connection</button>
                </div>
              )}
              {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm leading-relaxed text-red-400">{error}</p>}
              <button type="submit" disabled={pending || !isConnected || !selectedGame} className="btn btn-primary min-h-12 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">
                {pending ? 'Creating your room…' : isSolo ? 'Create solo lobby' : 'Create room'}
                {!pending && <ArrowRight size={19} aria-hidden="true" />}
              </button>
              <p className="text-center text-xs leading-relaxed text-slate-400">{isSolo ? 'Your bot will be waiting in the lobby.' : 'Your invite code is ready in the next step.'}</p>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
