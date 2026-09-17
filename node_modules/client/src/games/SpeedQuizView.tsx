import { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import type { Room } from '@gamehub/shared';
import { CheckCircle, LockKey, Timer, Trophy, XCircle } from '@phosphor-icons/react';

export function SpeedQuizView({ room, socket }: { room: Room, socket: Socket }) {
  const state = room.gameState?.state;
  const phase = state?.phase;
  const isHost = room.hostId === socket.id;
  const isParticipant = !!room.gameState?.players?.[socket.id || ''];
  const [now, setNow] = useState(Date.now);
  const timeLeft = (phase === 'playing' || phase === 'countdown') && state?.questionEndTime ? Math.max(0, state.questionEndTime - now) : 0;
  const leaderboard: { id: string, nickname: string, score: number }[] = (
    state?.leaderboard?.length ? state.leaderboard : Object.keys(room.gameState?.players || {}).map(id => ({ id, score: 0 }))
  ).map((entry: { id: string, score: number }) => ({
    ...entry,
    nickname: room.players.find(player => player.id === entry.id)?.nickname || 'Player left',
  }));

  useEffect(() => {
    if (!state?.questionEndTime || phase === 'game_over') return;
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, [phase, state?.questionEndTime]);

  const handleAnswer = (index: number) => {
    if (phase !== 'playing' || !isParticipant) return;
    if (state.playerAnswers?.[socket.id ?? '']) return;
    socket.emit('game_action', { type: 'submit_answer', payload: { answerIndex: index } });
  };

  if (!state || phase === 'waiting') {
    return (
      <div className="flex flex-1 items-center justify-center px-3 py-6 sm:p-8">
        <section className="panel w-full max-w-md p-6 text-center sm:p-8">
          <p className="eyebrow mb-3">Fast answers. More points.</p>
          <h2 className="font-['Outfit'] mb-4 text-3xl font-semibold tracking-tight">Speed quiz</h2>
          <p className="mb-8 text-slate-400">Test your knowledge against the clock.</p>
          <h3 className="mb-3 text-sm font-medium text-slate-300">Players ({room.players.length})</h3>
          <ul className="flex flex-wrap justify-center gap-2">
            {room.players.map(p => <li key={p.id} className="max-w-full break-words rounded-lg bg-slate-800 px-3 py-2 text-sm">{p.nickname}</li>)}
          </ul>
          <p className="mt-6 text-sm text-slate-400">{isHost ? 'Players need to ready up in the lobby before you start.' : 'Waiting for the host to start the quiz.'}</p>
        </section>
      </div>
    );
  }

  if (phase === 'game_over') {
    return (
      <div className="flex flex-1 items-center justify-center px-3 py-6 sm:p-8">
        <section className="panel w-full max-w-lg p-6 sm:p-8">
          <div role="status" className="text-center">
            <Trophy aria-hidden="true" size={40} className="mx-auto mb-4 text-emerald-300" />
            <p className="eyebrow mb-3">Final results</p>
            <h2 className="font-['Outfit'] text-3xl font-semibold tracking-tight">Quiz complete.</h2>
          </div>
          <ol className="mt-8 space-y-3">
            {leaderboard.map((p, index) => (
              <li key={p.id} className={`flex min-w-0 items-center justify-between gap-3 rounded-xl border p-4 ${p.id === room.gameState?.winnerId ? 'border-emerald-400/30 bg-emerald-400/10' : 'border-slate-800 bg-slate-900'}`}>
                <span className="text-sm tabular-nums text-slate-400">{index + 1}.</span>
                <div className="min-w-0 flex-1">
                  <p className="break-words font-medium">{p.nickname}{p.id === socket.id ? ' (you)' : ''}</p>
                  {p.id === room.gameState?.winnerId && <p className="text-xs text-emerald-300">Winner</p>}
                </div>
                <span className="shrink-0 font-semibold tabular-nums text-emerald-300">{p.score} pts</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    );
  }

  if (phase === 'countdown') {
    return (
      <div className="flex min-h-72 flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="eyebrow">Speed quiz</p>
        <h2 className="font-['Outfit'] text-4xl font-semibold tracking-tight">Get ready.</h2>
        <div role="timer" aria-label={`${Math.ceil(timeLeft / 1000)} seconds until start`} className="font-['Outfit'] text-7xl font-semibold tabular-nums text-emerald-300">{Math.ceil(timeLeft / 1000)}</div>
        <p className="text-sm text-slate-400">Choose one answer. The faster, the better.</p>
      </div>
    );
  }

  const currentQuestion = state.currentQuestion;
  const myAnswer = state.playerAnswers?.[socket.id ?? ''];
  const hasAnswered = !!myAnswer;
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / 15000) * 100));
  const feedback = !isParticipant ? 'You are watching this quiz.' : phase === 'round_result'
    ? !hasAnswered ? 'No answer submitted. 0 points this round.' : myAnswer.isCorrect ? `Correct. +${myAnswer.pointsEarned} points.` : 'Incorrect. 0 points this round.'
    : hasAnswered ? 'Answer locked. Waiting for the reveal.' : 'Choose one answer below.';

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-1 flex-col gap-5 px-3 py-6 sm:p-8">
      <header className="panel flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
        <div>
          <p className="eyebrow mb-1">Speed quiz</p>
          <h2 className="font-['Outfit'] text-xl font-semibold">Round {state.currentRound} / {state.totalRounds}</h2>
        </div>
        {phase === 'playing' ? (
          <div className="w-32">
            <div role="timer" aria-label={`${Math.ceil(timeLeft / 1000)} seconds remaining`} className={`flex items-center justify-end gap-2 text-2xl font-semibold tabular-nums ${timeLeft < 5000 ? 'text-amber-300' : 'text-emerald-300'}`}><Timer aria-hidden="true" size={22} />{(timeLeft / 1000).toFixed(1)}s</div>
            <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full origin-left bg-emerald-400" style={{ transform: `scaleX(${progressPercent / 100})` }} /></div>
          </div>
        ) : <p className="text-sm font-medium text-emerald-300">Round complete</p>}
      </header>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <section className="panel min-w-0 p-4 sm:p-6">
          {currentQuestion && <>
            <p className="eyebrow mb-3 text-emerald-300">{currentQuestion.category}</p>
            <h3 className="font-['Outfit'] mb-6 text-2xl font-semibold leading-snug tracking-tight break-words sm:text-3xl">{currentQuestion.question}</h3>
            <p role="status" aria-atomic="true" className="mb-5 flex items-center gap-2 text-sm text-slate-300">
              {phase === 'round_result' && hasAnswered ? myAnswer.isCorrect ? <CheckCircle aria-hidden="true" size={20} className="shrink-0 text-emerald-300" /> : <XCircle aria-hidden="true" size={20} className="shrink-0 text-rose-300" /> : hasAnswered && <LockKey aria-hidden="true" size={18} className="shrink-0" />}
              {feedback}
            </p>
            <div role="group" aria-label="Answer choices" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {currentQuestion.choices.map((choice: string, index: number) => {
                const isSelected = myAnswer?.answerIndex === index;
                const isCorrectChoice = phase === 'round_result' && currentQuestion.correctIndex === index;
                const isWrongSelection = phase === 'round_result' && isSelected && !isCorrectChoice;
                const buttonStyle = isCorrectChoice ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200'
                  : isWrongSelection ? 'border-rose-400 bg-rose-400/10 text-rose-200'
                  : isSelected ? 'border-emerald-300 bg-emerald-400/10 text-emerald-200'
                  : 'border-slate-600 bg-slate-900 text-slate-200 enabled:hover:border-emerald-300 enabled:hover:bg-slate-800';
                return (
                  <button key={index} type="button" onClick={() => handleAnswer(index)} disabled={hasAnswered || phase !== 'playing' || !isParticipant} aria-pressed={isSelected} className={`flex min-h-28 min-w-0 flex-col items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 motion-reduce:transition-none ${buttonStyle}`}>
                    <span className="text-xs font-semibold">{String.fromCharCode(65 + index)}</span>
                    <span className="break-words font-medium">{choice}</span>
                    {(isCorrectChoice || isSelected) && <span className="mt-auto flex items-center gap-1.5 text-xs font-medium">
                      {isCorrectChoice ? <CheckCircle aria-hidden="true" size={16} /> : isWrongSelection ? <XCircle aria-hidden="true" size={16} /> : <LockKey aria-hidden="true" size={16} />}
                      {isCorrectChoice ? isSelected ? 'Correct · your answer' : 'Correct answer' : isWrongSelection ? 'Your answer · incorrect' : 'Your answer · locked'}
                    </span>}
                  </button>
                );
              })}
            </div>
          </>}
        </section>
        <aside className="panel self-start p-4">
          <h3 className="eyebrow mb-2">Leaderboard</h3>
          <p className="mb-4 text-xs text-slate-400">Scores update after each round.</p>
          <ol className="space-y-3">
            {leaderboard.map((p, index) => {
              const answer = state.playerAnswers?.[p.id];
              return (
                <li key={p.id} className="flex min-w-0 items-center gap-3 border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                  <span className="text-xs tabular-nums text-slate-400">{index + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200" title={p.nickname}>{p.nickname}{p.id === socket.id ? ' (you)' : ''}</p>
                    <p className={`mt-1 text-xs ${phase === 'round_result' && answer?.isCorrect ? 'text-emerald-300' : 'text-slate-400'}`}>
                      {phase === 'playing' ? answer ? 'Answered' : 'Thinking' : answer ? answer.isCorrect ? `Correct · +${answer.pointsEarned}` : 'Incorrect · +0' : 'No answer · +0'}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums">{p.score}<span className="sr-only"> points</span></span>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </div>
  );
}
