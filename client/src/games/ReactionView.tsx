import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { Lightning, HandPalm, Trophy, ArrowRight } from '@phosphor-icons/react';

export function ReactionView({ room, socket }: { room: any, socket: Socket }) {
  const gameState = room.gameState;
  const scoreToWin = gameState?.state?.scoreToWin || 3;
  const leaderboard = room.players
    .map((p: any) => ({
      id: p.id,
      nickname: p.nickname,
      score: gameState?.players?.[p.id]?.score ?? 0,
      isMe: p.id === socket.id,
    }))
    .sort((a: any, b: any) => b.score - a.score);
  const triggerTime = gameState?.state?.triggerTime;
  const phase = gameState?.state?.phase;
  const [readyTrigger, setReadyTrigger] = useState<number | null>(null);
  const localPhase = phase === 'waiting' && triggerTime && readyTrigger === triggerTime ? 'ready' : phase;

  useEffect(() => {
    if (phase !== 'waiting' || !triggerTime) return;
    const timeout = setTimeout(() => setReadyTrigger(triggerTime), Math.max(0, triggerTime - Date.now()));
    return () => clearTimeout(timeout);
  }, [phase, triggerTime]);

  useEffect(() => {
    if (room.hostId === socket.id && gameState?.status === 'playing' && phase === 'waiting' && !triggerTime) {
      socket.emit('game_action', { type: 'start_round' });
    }
  }, [room.hostId, socket, gameState?.status, phase, triggerTime]);

  const finished = gameState?.status === 'finished';
  const winnerPlayer = room.players.find((p: any) => p.id === gameState?.winnerId);
  const roundWinnerPlayer = room.players.find((p: any) => p.id === gameState?.state?.roundWinnerId);
  const falseStartPlayer = room.players.find((p: any) => p.id === gameState?.state?.falseStartId);
  const canReact = gameState?.status === 'playing' && !!triggerTime && !!gameState?.players?.[socket.id || ''] && (localPhase === 'waiting' || localPhase === 'ready');

  const handleClick = () => {
    if (!canReact) return;
    socket.emit('game_action', { type: 'click' });
  };

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col gap-5 px-3 py-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-['Outfit'] text-2xl font-semibold tracking-tight">Reaction rush</h2>
        <p className="eyebrow">First to {scoreToWin}</p>
      </div>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {leaderboard.map((entry: any, i: number) => (
          <li key={entry.id} className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 ${entry.isMe ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-slate-800 bg-slate-900'}`}>
            <span className="text-xs tabular-nums text-slate-400">{String(i + 1).padStart(2, '0')}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-slate-300" title={entry.nickname}>{entry.isMe ? 'You' : entry.nickname}</span>
            <span className={`font-['Outfit'] text-2xl font-semibold tabular-nums ${entry.isMe ? 'text-emerald-300' : 'text-slate-100'}`}>{entry.score}</span>
          </li>
        ))}
      </ol>
      {finished || localPhase === 'result' ? (
        <div className="panel flex min-h-72 flex-1 flex-col items-center justify-center gap-5 p-6 text-center sm:min-h-96 sm:p-10">
          <div role="status" aria-atomic="true" className="w-full">
            {finished && <Trophy aria-hidden="true" size={40} className="mx-auto mb-5 text-amber-400" />}
            <p className="eyebrow mb-3">{finished ? 'Final result' : 'Round result'}</p>
            <h3 className={`font-['Outfit'] text-3xl font-semibold leading-tight tracking-tight break-words sm:text-4xl ${finished ? gameState.winnerId === socket.id ? 'text-emerald-300' : 'text-rose-400' : gameState.state.roundWinnerId === socket.id ? 'text-emerald-300' : gameState.state.roundWinnerId ? 'text-rose-400' : 'text-amber-400'}`}>
              {finished ? gameState.winnerId === socket.id ? 'You won.' : `${winnerPlayer?.nickname || 'Another player'} wins.` : gameState.state.roundWinnerId === socket.id ? 'Quick off the mark.' : gameState.state.roundWinnerId ? `${roundWinnerPlayer?.nickname || 'Another player'} was faster.` : 'A little too soon.'}
            </h3>
            {gameState.state.falseStartId && <p className="mt-4 text-amber-300 break-words">{falseStartPlayer?.nickname || 'A player'} reacted before the signal. No points this round.</p>}
            {gameState.state.reactionTimeMs != null && !gameState.state.falseStartId && (
              <p className="mt-5 text-sm text-slate-400">Winning reaction <span className="mt-1 block font-['Outfit'] text-5xl font-medium tabular-nums text-slate-100">{gameState.state.reactionTimeMs}<span className="ml-1 text-xl text-slate-400">ms</span></span></p>
            )}
          </div>
          {!finished && (room.hostId === socket.id ? (
            <button type="button" onClick={() => socket.emit('game_action', { type: 'start_round' })} className="btn btn-primary">Next round <ArrowRight aria-hidden="true" size={18} /></button>
          ) : <p className="text-sm text-slate-400">Waiting for the host to start the next round…</p>)}
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={handleClick}
            aria-disabled={!canReact}
            aria-describedby="reaction-instructions"
            className={`flex min-h-72 w-full flex-1 flex-col items-center justify-center gap-5 rounded-2xl border p-6 text-center focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white sm:min-h-96 ${localPhase === 'ready' ? 'border-emerald-300 bg-emerald-400 text-slate-950' : 'border-rose-400/40 bg-rose-950 text-rose-100'}`}
          >
            {localPhase === 'ready' ? <Lightning aria-hidden="true" size={48} weight="fill" /> : <HandPalm aria-hidden="true" size={48} weight="duotone" />}
            <span aria-live="assertive" aria-atomic="true" className="font-['Outfit'] text-5xl font-semibold tracking-tight sm:text-7xl">{localPhase === 'ready' ? 'Go!' : 'Wait for it…'}</span>
            <span className="text-sm">{localPhase === 'ready' ? 'Tap, click or press your key now.' : 'Stay ready. Don’t react until “Go!” appears.'}</span>
          </button>
          <p id="reaction-instructions" className="text-center text-sm text-slate-400">Focus the pad with Tab. Use Enter or Space, or tap the pad.</p>
        </>
      )}
    </div>
  );
}
