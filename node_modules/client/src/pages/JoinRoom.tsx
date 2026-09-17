import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Hash, Ticket, Users, WifiHigh } from '@phosphor-icons/react';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useSocket } from '../hooks/useSocket';
import type { Room } from '@gamehub/shared';

const normalizeCode = (value: string) => value.toUpperCase().replace(/[\s-]/g, '');
const validCode = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

export function JoinRoom() {
  const { profile, updateProfile } = useSessionProfile();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('code') || '';
  const [nickname, setNickname] = useState(profile.nickname);
  const [roomId, setRoomId] = useState(() => normalizeCode(inviteCode));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const codeInput = useRef<HTMLInputElement>(null);
  const nicknameInput = useRef<HTMLInputElement>(null);
  const responseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearPending = () => {
      if (responseTimer.current !== null) clearTimeout(responseTimer.current);
      responseTimer.current = null;
      setPending(false);
    };
    const onRoomJoined = (room: Room) => {
      if (responseTimer.current === null) return;
      clearPending();
      navigate(`/room/${room.id}`);
    };
    const onError = (data: { message: string }) => {
      if (responseTimer.current === null) return;
      clearPending();
      const messages: Record<string, string> = {
        'Room not found': 'We couldn’t find that room. Check the code with your host, or ask for a new invite.',
        'Room is full': 'This room is full. Ask your host to make space or create another room.',
        'Game already in progress': 'This group is already playing. Ask your host to return to the lobby, then try again.'
      };
      setError(messages[data.message] || data.message || 'Could not join this room. Please try again.');
    };
    const onDisconnect = () => {
      if (responseTimer.current === null) return;
      clearPending();
      setError('Connection interrupted. Once reconnected, try joining again.');
    };
    socket.on('room_joined', onRoomJoined);
    socket.on('error', onError);
    socket.on('disconnect', onDisconnect);
    if (!socket.connected) socket.connect();
    return () => {
      socket.off('room_joined', onRoomJoined);
      socket.off('error', onError);
      socket.off('disconnect', onDisconnect);
      if (responseTimer.current !== null) clearTimeout(responseTimer.current);
      responseTimer.current = null;
    };
  }, [socket, navigate]);

  const handleJoin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (responseTimer.current !== null) return;
    setError('');
    const code = normalizeCode(roomId);
    const nextCodeError = validCode.test(code) ? '' : 'Enter the 6-character code from your host. Codes use A–Z and 2–9, without I or O.';
    const nextNicknameError = nickname.trim() && nickname.trim().length <= 15 ? '' : 'Choose a nickname between 1 and 15 characters.';
    setCodeError(nextCodeError);
    setNicknameError(nextNicknameError);
    if (nextCodeError || nextNicknameError) {
      (nextCodeError ? codeInput : nicknameInput).current?.focus();
      return;
    }
    if (!socket.connected) {
      setError('Connect to the game server before joining. Check your internet connection and retry.');
      socket.connect();
      return;
    }
    setRoomId(code);
    updateProfile({ nickname: nickname.trim() });
    setPending(true);
    responseTimer.current = setTimeout(() => {
      responseTimer.current = null;
      setPending(false);
      setError('The server did not respond in time. Check your connection and try joining again.');
    }, 12000);
    socket.emit('join_room', {
      nickname: nickname.trim(),
      avatarSeed: profile.avatarSeed,
      roomId: code
    });
  };

  return (
    <div className="page-container flex-1 py-8 sm:py-12 lg:py-16">
      <Link to="/" className="btn btn-ghost mb-8 w-fit text-sm text-slate-400 hover:text-white sm:mb-12">
        <ArrowLeft size={18} aria-hidden="true" /> Back to arcade
      </Link>
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <section className="lg:pt-5" aria-labelledby="join-title">
          <p className="eyebrow mb-5">There’s a place for you</p>
          <h1 id="join-title" className="max-w-lg text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Good company.<br /><span className="text-emerald-400">One code away.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-slate-400 sm:text-lg">
            Your friends bring the invite. You bring your game face. Step into their room and make a night of it.
          </p>
          <ol className="mt-10 hidden max-w-md divide-y divide-slate-800 sm:block lg:mt-14">
            {[
              { icon: Hash, title: 'Grab the room code', detail: 'Ask your host for the six-character invite.' },
              { icon: Users, title: 'Make your entrance', detail: 'Choose a nickname your friends will recognize.' },
              { icon: Check, title: 'Meet in the lobby', detail: 'Catch up, ready up, and play together.' }
            ].map((step, index) => (
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

        <section className="panel min-w-0 p-6 sm:p-8 lg:p-10" aria-labelledby="join-form-title">
          <div className="mb-8 flex items-start justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <p className="eyebrow mb-2">Your invitation</p>
              <h2 id="join-form-title" className="text-2xl font-medium">Join the room</h2>
            </div>
            <Ticket size={28} weight="duotone" className="shrink-0 text-emerald-400" aria-hidden="true" />
          </div>
          <form onSubmit={handleJoin} noValidate className="space-y-7" aria-busy={pending}>
            <div>
              <label htmlFor="roomId" className="field-label">Room code <span className="text-slate-500">(required)</span></label>
              <input
                ref={codeInput}
                id="roomId"
                name="roomId"
                type="text"
                value={roomId}
                onChange={event => { setRoomId(normalizeCode(event.target.value)); setCodeError(''); setError(''); }}
                onPaste={event => {
                  event.preventDefault();
                  setRoomId(normalizeCode(event.clipboardData.getData('text')));
                  setCodeError('');
                  setError('');
                }}
                className="field mt-2 min-h-16 text-center font-mono text-2xl uppercase tracking-[0.2em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:text-3xl"
                placeholder="ABC234"
                required
                minLength={6}
                maxLength={6}
                pattern="[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                disabled={pending}
                aria-invalid={!!codeError}
                aria-describedby="room-code-help"
              />
              <p id="room-code-help" className={`mt-2 text-xs leading-relaxed ${codeError ? 'text-red-400' : 'text-slate-400'}`} aria-live="polite">
                {codeError || (inviteCode && normalizeCode(inviteCode) === roomId && validCode.test(roomId) ? 'Code added from your invite. Just add your nickname.' : 'Paste the 6-character code from your host. Spaces are removed automatically.')}
              </p>
            </div>
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
              <button type="submit" disabled={pending || !isConnected} className="btn btn-primary min-h-12 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50">
                {pending ? 'Joining your friends…' : 'Join room'}
                {!pending && <ArrowRight size={19} aria-hidden="true" />}
              </button>
            </div>
          </form>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2 border-t border-slate-800 pt-5 text-sm">
            <span className="text-slate-400">No invite yet?</span>
            <Link to="/create-room" className="btn btn-ghost text-emerald-400">Create your own room <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </section>
      </div>
    </div>
  );
}
