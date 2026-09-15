import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

export function ReactionView({ room, socket }: { room: any, socket: Socket }) {
  const gameState = room.gameState;
  const scoreToWin = gameState?.state?.scoreToWin || 3;

  // Build a sorted leaderboard
  const leaderboard = room.players
    .map((p: any) => ({
      id: p.id,
      nickname: p.nickname,
      score: gameState?.players[p.id]?.score ?? 0,
      isMe: p.id === (socket.id || ''),
    }))
    .sort((a: any, b: any) => b.score - a.score);

  const [localPhase, setLocalPhase] = useState<'waiting' | 'ready' | 'result'>(gameState?.state?.phase);

  useEffect(() => {
    if (gameState?.state?.phase !== 'waiting') {
      setLocalPhase(gameState?.state?.phase);
    }

    if (gameState?.state?.phase === 'waiting' && gameState?.state?.triggerTime) {
      const now = Date.now();
      const delay = gameState.state.triggerTime - now;

      if (delay <= 0) {
        setLocalPhase('ready');
      } else {
        const timeout = setTimeout(() => {
          setLocalPhase('ready');
        }, delay);
        return () => clearTimeout(timeout);
      }
    }
  }, [gameState?.state?.phase, gameState?.state?.triggerTime]);

  // If host and no triggerTime (first round), start it automatically
  useEffect(() => {
    if (room.hostId === socket.id && gameState?.status === 'playing' && gameState?.state?.phase === 'waiting' && !gameState?.state?.triggerTime) {
      socket.emit('game_action', { type: 'start_round' });
    }
  }, [room.hostId, socket, gameState?.status, gameState?.state?.phase, gameState?.state?.triggerTime]);

  const handleClick = () => {
    if (gameState?.status !== 'playing') return;
    socket.emit('game_action', { type: 'click' });
  };

  const handleNextRound = () => {
    socket.emit('game_action', { type: 'start_round' });
  };

  const renderBackground = () => {
    if (gameState?.status === 'finished') return 'bg-slate-950';
    if (localPhase === 'waiting') return 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700 cursor-pointer';
    if (localPhase === 'ready') return 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 cursor-pointer';
    return 'bg-slate-900';
  };

  const winnerPlayer = gameState?.winnerId ? room.players.find((p: any) => p.id === gameState.winnerId) : null;
  const roundWinnerPlayer = gameState?.state?.roundWinnerId ? room.players.find((p: any) => p.id === gameState.state.roundWinnerId) : null;
  const falseStartPlayer = gameState?.state?.falseStartId ? room.players.find((p: any) => p.id === gameState.state.falseStartId) : null;

  return (
    <div className="flex-1 flex flex-col p-4 relative h-full">
      {/* Top Leaderboard */}
      <div className="flex items-center gap-4 mb-4 bg-slate-900 border border-slate-800 p-4 rounded-xl z-10 shadow-lg overflow-x-auto">
        {leaderboard.map((entry: any, i: number) => (
          <div
            key={entry.id}
            className={`flex flex-col items-center min-w-[4rem] px-3 py-2 rounded-lg ${entry.isMe ? 'bg-emerald-500/10 border border-emerald-500/30' : ''}`}
          >
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
              {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}th`}
            </span>
            <span className={`text-2xl font-bold ${entry.isMe ? 'text-emerald-400' : 'text-slate-300'}`}>{entry.score}</span>
            <span className="text-[11px] text-slate-400 mt-1 truncate max-w-[5rem]">{entry.isMe ? 'You' : entry.nickname}</span>
          </div>
        ))}
        <div className="ml-auto text-slate-500 font-bold tracking-widest text-xs whitespace-nowrap">FIRST TO {scoreToWin}</div>
      </div>

      <div 
        className={`flex-1 flex flex-col items-center justify-center rounded-2xl transition-colors duration-200 ${renderBackground()}`}
        onClick={handleClick}
      >
        {gameState?.status === 'finished' ? (
          <div className="text-center z-10" onClick={e => e.stopPropagation()}>
            <h2 className="text-5xl font-bold mb-4">
              {gameState.winnerId === socket.id 
                ? <span className="text-emerald-400">You Won!</span> 
                : <span className="text-rose-400">{winnerPlayer?.nickname || 'Someone'} Won!</span>
              }
            </h2>
            {room.hostId === socket.id && (
              <button 
                onClick={() => socket.emit('back_to_lobby')}
                className="text-lg bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl transition-colors font-bold mt-4 border border-slate-700"
              >
                Play Again
              </button>
            )}
          </div>
        ) : (
          <div className="text-center select-none pointer-events-none">
            {localPhase === 'waiting' && (
              <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg">WAIT…</h1>
            )}
            
            {localPhase === 'ready' && (
              <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg">CLICK!</h1>
            )}

            {localPhase === 'result' && (
              <div className="bg-slate-900/90 p-8 rounded-2xl backdrop-blur-sm pointer-events-auto shadow-2xl border border-slate-800">
                <h2 className="text-3xl font-bold mb-4">
                  {gameState.state.roundWinnerId === socket.id ? (
                    <span className="text-emerald-400">You got it!</span>
                  ) : gameState.state.roundWinnerId ? (
                    <span className="text-rose-400">{roundWinnerPlayer?.nickname || 'Someone'} was faster!</span>
                  ) : (
                    <span className="text-amber-400">No winner this round</span>
                  )}
                </h2>
                
                {gameState.state.falseStartId && (
                  <p className="text-amber-400 mb-4 font-medium text-lg">
                    {falseStartPlayer?.nickname || 'Someone'} clicked too early!
                  </p>
                )}
                
                {gameState.state.reactionTimeMs && !gameState.state.falseStartId && (
                  <p className="text-slate-300 mb-6 font-mono text-xl">
                    Reaction: {gameState.state.reactionTimeMs}ms
                  </p>
                )}

                {room.hostId === socket.id && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleNextRound(); }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-3 rounded-xl font-bold transition-all active:scale-95"
                  >
                    Next Round
                  </button>
                )}
                {room.hostId !== socket.id && (
                  <p className="text-slate-400 text-sm mt-4">Waiting for host…</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
