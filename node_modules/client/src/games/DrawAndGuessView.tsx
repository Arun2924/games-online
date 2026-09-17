import React, { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { CheckCircle, Eraser, PencilSimple, Trash, Trophy, Timer, PaperPlaneTilt } from '@phosphor-icons/react';

export const DrawAndGuessView: React.FC<{ room: any, socket: Socket }> = ({ room, socket }) => {
  const gameState = room.gameState;
  const players: any[] = room.players;
  const playerId = socket.id;
  const onAction = (action: any) => socket.emit('game_action', action);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [guessInput, setGuessInput] = useState('');
  const currentStrokeId = useRef<string | null>(null);
  const lastPos = useRef<{ x: number, y: number } | null>(null);
  const { state, status, winnerId } = gameState;
  const isDrawer = state.drawerId === playerId;
  const drawerPlayer = players.find(p => p.id === state.drawerId);
  const hasGuessed = (state.correctGuessers || []).includes(playerId);
  const isParticipant = !!gameState.players?.[playerId || ''];
  const leaderboard = Object.keys(gameState.players || {}).map(id => ({
    id,
    nickname: players.find(p => p.id === id)?.nickname || 'Player left',
    score: gameState.players[id].score ?? 0,
  })).sort((a, b) => b.score - a.score);
  const [now, setNow] = useState(Date.now);
  const timeLeft = state.endTime && status !== 'finished' ? Math.max(0, Math.ceil((state.endTime - now) / 1000)) : 0;

  useEffect(() => {
    if (!state.endTime || status === 'finished') return;
    const interval = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(interval);
  }, [state.endTime, status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const history = state.drawHistory || [];
    history.forEach((ev: any) => {
      if (ev.type === 'draw') {
        ctx.beginPath();
        ctx.moveTo(ev.x0, ev.y0);
        ctx.lineTo(ev.x1, ev.y1);
        ctx.strokeStyle = ev.color;
        ctx.lineWidth = ev.size;
        ctx.stroke();
        ctx.closePath();
      }
    });
  }, [state.drawHistory]);

  useEffect(() => {
    const handleCustomEvent = (ev: any) => {
      if (ev.type === 'draw') {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(ev.x0, ev.y0);
        ctx.lineTo(ev.x1, ev.y1);
        ctx.strokeStyle = ev.color;
        ctx.lineWidth = ev.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.closePath();
      } else if (ev.type === 'clear') {
        const canvas = canvasRef.current;
        if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    socket.on('game_custom_event', handleCustomEvent);
    return () => {
      socket.off('game_custom_event', handleCustomEvent);
    };
  }, [socket]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || state.phase !== 'playing') return;
    setIsDrawing(true);
    lastPos.current = getPos(e);
    currentStrokeId.current = Math.random().toString(36).substring(2, 9);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer || state.phase !== 'playing' || !lastPos.current) return;
    const newPos = getPos(e);
    const ev = {
      type: 'draw',
      strokeId: currentStrokeId.current,
      x0: lastPos.current.x,
      y0: lastPos.current.y,
      x1: newPos.x,
      y1: newPos.y,
      color,
      size: lineWidth
    };
    socket.emit('game_custom_event', ev);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(ev.x0, ev.y0);
      ctx.lineTo(ev.x1, ev.y1);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.closePath();
    }
    lastPos.current = newPos;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    lastPos.current = null;
    currentStrokeId.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const clearCanvas = () => {
    if (!isDrawer || state.phase !== 'playing') return;
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('game_custom_event', { type: 'clear' });
  };

  const submitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || isDrawer || hasGuessed || !isParticipant || state.phase !== 'playing') return;
    onAction({ type: 'guess', payload: { text: guessInput } });
    setGuessInput('');
  };

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-5 px-3 py-6 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0" role="status" aria-atomic="true">
          <p className="eyebrow mb-2">Draw & guess · Round {state.round} / {state.maxRounds}</p>
          <h2 className="font-['Outfit'] text-2xl font-semibold tracking-tight break-words sm:text-3xl">
            {status === 'finished' ? 'The final sketch.' : state.phase === 'countdown' ? 'Get your ideas ready.' : state.phase === 'playing' ? isDrawer ? 'Your turn to draw.' : `${drawerPlayer?.nickname || 'A player'} is drawing.` : 'The reveal.'}
          </h2>
        </div>
        {status !== 'finished' && <div role="timer" aria-label={`${timeLeft} seconds remaining`} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-emerald-300">
          <Timer aria-hidden="true" size={22} /><span className="text-2xl font-semibold tabular-nums">{timeLeft}s</span>
        </div>}
      </header>
      <div role="status" aria-atomic="true" className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-center">
        {status === 'finished' ? (
          <div className="flex flex-wrap items-center justify-center gap-3 text-xl font-semibold text-emerald-300">
            <Trophy aria-hidden="true" size={26} /><span className="min-w-0 break-words">{winnerId ? `${players.find(p => p.id === winnerId)?.nickname || 'Another player'} wins.` : 'Game complete.'}</span>
          </div>
        ) : state.phase === 'playing' ? (
          <>
            <p className="eyebrow mb-2">{isDrawer ? 'Your secret word' : `${state.wordLength} letters`}</p>
            <p aria-label={isDrawer ? undefined : `Hidden word, ${state.wordLength} letters`} className="font-['Outfit'] text-2xl font-semibold tracking-widest break-words text-emerald-300">{isDrawer ? state.word?.toUpperCase() : Array(state.wordLength || 0).fill('_').join(' ')}</p>
          </>
        ) : state.phase === 'result' ? (
          <p className="text-slate-300">The word was <strong className="font-['Outfit'] text-xl break-words text-emerald-300">{state.roundResults?.word?.toUpperCase()}</strong></p>
        ) : <p className="text-sm text-slate-300">{isDrawer ? 'Draw the word without writing letters.' : 'Watch the canvas. Guess the word before time runs out.'}</p>}
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0">
          <h3 className="sr-only">Drawing canvas</h3>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-700 bg-white">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              aria-label={isDrawer ? 'Draw your word here using a pointer or touch' : `Live drawing by ${drawerPlayer?.nickname || 'a player'}`}
              className={`block h-full w-full ${isDrawer && state.phase === 'playing' ? 'touch-none cursor-crosshair' : 'cursor-default'}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onLostPointerCapture={handlePointerUp}
            >A shared canvas for drawing and guessing words.</canvas>
            {state.phase === 'countdown' && <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 p-6 text-center">
              <p className="font-['Outfit'] text-2xl font-semibold text-slate-100">A new canvas. A new word.</p>
            </div>}
          </div>
          {isDrawer && state.phase === 'playing' && (
            <div role="group" aria-label="Drawing tools" className="panel mt-3 flex flex-wrap items-center gap-2 p-3">
              <label htmlFor="draw-color" className="flex items-center gap-2 text-sm text-slate-300">Ink
                <input id="draw-color" type="color" value={color} onChange={e => setColor(e.target.value)} className="h-11 w-11 cursor-pointer rounded-lg border border-slate-600 bg-slate-900 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300" />
              </label>
              <button type="button" aria-pressed={color === '#000000' && lineWidth === 5} onClick={() => { setColor('#000000'); setLineWidth(5); }} className={`btn ${color === '#000000' && lineWidth === 5 ? 'btn-primary' : 'btn-secondary'}`}><PencilSimple aria-hidden="true" size={18} />Pen</button>
              <button type="button" aria-pressed={color === '#ffffff'} onClick={() => { setColor('#ffffff'); setLineWidth(20); }} className={`btn ${color === '#ffffff' ? 'btn-primary' : 'btn-secondary'}`}><Eraser aria-hidden="true" size={18} />Eraser</button>
              <button type="button" onClick={clearCanvas} className="btn btn-ghost sm:ml-auto"><Trash aria-hidden="true" size={18} />Clear</button>
              <p className="w-full text-xs text-slate-400">{color === '#ffffff' ? 'Eraser selected' : `Pen selected · ${lineWidth}px · ${color}`}</p>
            </div>
          )}
        </section>
        <aside className="flex min-w-0 flex-col gap-4">
          <section className="panel p-4">
            <h3 className="eyebrow mb-4">Scores</h3>
            <ol className="space-y-3">
              {leaderboard.map((p, index) => (
                <li key={p.id} className="flex min-w-0 items-center gap-3 text-sm">
                  <span className="text-xs tabular-nums text-slate-400">{index + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-200" title={p.nickname}>{p.nickname}{p.id === playerId ? ' (you)' : ''}</p>
                    {p.id === state.drawerId ? <span className="flex items-center gap-1 text-xs text-emerald-300"><PencilSimple aria-hidden="true" size={12} />Drawing</span> : (state.correctGuessers || []).includes(p.id) && <span className="flex items-center gap-1 text-xs text-emerald-300"><CheckCircle aria-hidden="true" size={12} />Guessed it</span>}
                  </div>
                  <span className="font-semibold tabular-nums text-slate-100">{p.score}<span className="sr-only"> points</span></span>
                </li>
              ))}
            </ol>
          </section>
          <section className="panel flex min-w-0 flex-1 flex-col p-4">
            <h3 id="draw-guesses" className="eyebrow mb-4">Guesses</h3>
            <div role="log" aria-labelledby="draw-guesses" tabIndex={0} className="mb-4 flex max-h-60 min-h-24 flex-1 flex-col gap-2 overflow-y-auto rounded-lg text-sm focus-visible:outline-2 focus-visible:outline-emerald-300">
              {!(state.guesses || []).length && <p className="text-slate-400">No guesses yet. One good clue can change that.</p>}
              {(state.guesses || []).map((g: any, i: number) => (
                <p key={g.id || i} className={`break-words rounded-lg p-2 ${g.isCorrect ? 'bg-emerald-400/10 text-emerald-300' : 'text-slate-300'}`}>
                  <span className="font-semibold">{players.find(p => p.id === g.playerId)?.nickname || 'Player left'}: </span>
                  {g.isCorrect ? <span><CheckCircle aria-hidden="true" className="mr-1 inline" size={16} />Guessed the word.</span> : g.text}
                </p>
              ))}
            </div>
            {!isDrawer && isParticipant && state.phase === 'playing' ? (
              <form onSubmit={submitGuess}>
                <label htmlFor="draw-guess" className="field-label">Your guess</label>
                <div className="flex gap-2">
                  <input id="draw-guess" type="text" value={guessInput} onChange={e => setGuessInput(e.target.value)} placeholder={hasGuessed ? 'You got it.' : 'Type a word'} disabled={hasGuessed} autoComplete="off" className="field min-w-0 flex-1" />
                  <button type="submit" aria-label="Send guess" disabled={hasGuessed || !guessInput.trim()} className="btn btn-primary"><PaperPlaneTilt aria-hidden="true" size={20} /></button>
                </div>
              </form>
            ) : <p className="text-sm text-slate-400">{status === 'finished' ? 'All rounds complete.' : isDrawer && state.phase === 'playing' ? 'Your friends are guessing.' : !isParticipant ? 'You are watching this game.' : 'Next round starts shortly.'}</p>}
          </section>
        </aside>
      </div>
    </div>
  );
};
