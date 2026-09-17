import type { Socket } from 'socket.io-client';
import { HandFist, HandPalm, Scissors, LockKey, ArrowRight, Trophy } from '@phosphor-icons/react';

const choices = [
  { value: 'rock', label: 'Rock', Icon: HandFist },
  { value: 'paper', label: 'Paper', Icon: HandPalm },
  { value: 'scissors', label: 'Scissors', Icon: Scissors },
];

export function RockPaperScissorsView({ room, socket }: { room: any, socket: Socket }) {
  const gameState = room.gameState;
  const myPlayer = gameState?.players?.[socket.id || ''];
  const opponentId = Object.keys(gameState?.players || {}).find(id => id !== socket.id);
  const opponent = opponentId ? gameState?.players?.[opponentId] : null;
  const opponentName = room.players.find((p: any) => p.id === opponentId)?.nickname || 'Opponent';
  const roundResult = gameState?.state?.roundResult;
  const finished = gameState?.status === 'finished';
  const canChoose = !!myPlayer && !myPlayer.choice && !roundResult && gameState?.status === 'playing';

  const handleChoice = (choice: string) => {
    if (!canChoose) return;
    socket.emit('game_action', { type: 'play_move', payload: { choice } });
  };

  const statusText = finished
    ? gameState.winnerId === socket.id ? 'You won the match.' : `${opponentName} wins the match.`
    : roundResult
      ? roundResult.winner === 'draw' ? 'Great minds. Same move.' : roundResult.winner === socket.id ? 'This round is yours.' : `${opponentName} takes the round.`
      : myPlayer?.choice ? 'Your move is locked.' : 'Trust your instinct.';

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-1 flex-col gap-6 px-3 py-6 sm:p-8">
      <div className="panel grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-sm text-slate-400">You</p>
          <p className="font-['Outfit'] text-4xl font-semibold tabular-nums text-emerald-300">{myPlayer?.score || 0}</p>
        </div>
        <p className="eyebrow text-center">First to 3</p>
        <div className="min-w-0 text-right">
          <p className="truncate text-sm text-slate-400" title={opponentName}>{opponentName}</p>
          <p className="font-['Outfit'] text-4xl font-semibold tabular-nums text-slate-100">{opponent?.score || 0}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-4 sm:py-8">
        <div className="w-full text-center" role="status" aria-atomic="true">
          {finished && <Trophy aria-hidden="true" size={36} className="mx-auto mb-4 text-amber-400" />}
          <p className="eyebrow mb-3">{finished ? 'Final result' : roundResult ? 'The reveal' : 'Rock / Paper / Scissors'}</p>
          <h2 className={`font-['Outfit'] text-3xl font-semibold leading-tight tracking-tight break-words sm:text-4xl ${finished ? gameState.winnerId === socket.id ? 'text-emerald-300' : 'text-rose-400' : roundResult ? roundResult.winner === 'draw' ? 'text-amber-400' : roundResult.winner === socket.id ? 'text-emerald-300' : 'text-rose-400' : 'text-slate-100'}`}>
            {statusText}
          </h2>
          <p className="mt-3 text-sm text-slate-400">{roundResult || finished ? 'One move can change everything.' : myPlayer?.choice ? `Waiting for ${opponentName} to choose…` : 'Pick one. Your opponent won’t see it until the reveal.'}</p>
        </div>
        {roundResult ? (
          <div className="grid w-full max-w-md grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-5">
            {[socket.id || '', opponentId || ''].map((id, index) => {
              const choice = choices.find(item => item.value === roundResult.choices[id]);
              const Icon = choice?.Icon || LockKey;
              return (
                <div key={index} className={`min-w-0 ${index === 1 ? 'col-start-3 row-start-1' : ''}`}>
                  <p className="mb-3 truncate text-center text-sm text-slate-400" title={index === 0 ? 'You' : opponentName}>{index === 0 ? 'You' : opponentName}</p>
                  <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 p-3 text-emerald-300">
                    <Icon aria-hidden="true" weight="duotone" className="h-10 w-10 sm:h-16 sm:w-16" />
                    <span className="text-sm font-medium text-slate-100">{choice?.label || 'Hidden'}</span>
                  </div>
                </div>
              );
            })}
            <span className="col-start-2 row-start-1 mt-8 text-xs font-semibold text-slate-400">VS</span>
          </div>
        ) : !finished && (
          <div role="group" aria-label="Choose your move" className="grid w-full max-w-md grid-cols-3 gap-2 sm:gap-3">
            {choices.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleChoice(value)}
                disabled={!canChoose}
                aria-pressed={myPlayer?.choice === value}
                className={`flex min-w-0 flex-col items-center justify-center gap-3 rounded-2xl border px-2 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 sm:py-8 ${myPlayer?.choice === value ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300' : 'border-slate-700 bg-slate-900 text-slate-300 enabled:hover:border-emerald-400 enabled:hover:bg-slate-800'} ${myPlayer?.choice && myPlayer.choice !== value ? 'opacity-50' : ''}`}
              >
                <Icon aria-hidden="true" weight="duotone" className="h-9 w-9 sm:h-14 sm:w-14" />
                <span className="text-sm font-medium">{label}</span>
                {myPlayer?.choice === value && <span className="flex items-center gap-1 text-xs"><LockKey aria-hidden="true" size={12} />Locked</span>}
              </button>
            ))}
          </div>
        )}
        {roundResult && !finished && (
          <button type="button" onClick={() => socket.emit('game_action', { type: 'next_round' })} className="btn btn-primary">
            Next round <ArrowRight aria-hidden="true" size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
