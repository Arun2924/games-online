import { Socket } from 'socket.io-client';

const BOT_ID_PREFIX = 'bot_';

export function RockPaperScissorsView({ room, socket }: { room: any, socket: Socket }) {
  const gameState = room.gameState;
  const myPlayer = gameState?.players[socket.id || ''];
  const opponentId = Object.keys(gameState?.players || {}).find(id => id !== socket.id);
  const opponent = opponentId ? gameState?.players[opponentId] : null;
  const opponentInfo = room.players.find((p: any) => p.id === opponentId);
  const opponentName = opponentInfo?.nickname || 'Opponent';
  const opponentIsBot = opponentId?.startsWith(BOT_ID_PREFIX);

  const handleChoice = (choice: string) => {
    if (myPlayer?.choice) return;
    if (gameState?.status !== 'playing') return;

    socket.emit('game_action', {
      type: 'play_move',
      payload: { choice }
    });
  };

  const handleNextRound = () => {
    socket.emit('game_action', { type: 'next_round' });
  };

  const renderIcon = (choice: string | null) => {
    if (choice === 'rock') return '✊';
    if (choice === 'paper') return '✋';
    if (choice === 'scissors') return '✌️';
    return '?';
  };

  const roundResult = gameState?.state?.roundResult;

  return (
    <div className="flex-1 flex flex-col p-4 relative h-full">
      {/* Top Scores */}
      <div className="flex justify-between items-center mb-8 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex flex-col items-start">
          <span className="text-sm text-slate-400">You</span>
          <span className="text-3xl font-bold text-emerald-400">{myPlayer?.score || 0}</span>
        </div>
        <div className="text-slate-500 font-bold tracking-widest text-sm">FIRST TO 3</div>
        <div className="flex flex-col items-end">
          <span className="text-sm text-slate-400">{opponentName}</span>
          <span className="text-3xl font-bold text-rose-400">{opponent?.score || 0}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {gameState?.status === 'finished' ? (
          <div className="text-center z-10">
            <h2 className="text-5xl font-bold mb-4">
              {gameState.winnerId === socket.id 
                ? <span className="text-emerald-400">You Won!</span> 
                : <span className="text-rose-400">{opponentIsBot ? `${opponentName} Won!` : 'You Lost!'}</span>
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
          <>
            {roundResult ? (
              <div className="flex flex-col items-center text-center">
                <h3 className="text-2xl font-bold mb-8">
                  {roundResult.winner === 'draw' ? <span className="text-amber-400">Draw!</span> : (
                    roundResult.winner === socket.id ? <span className="text-emerald-400">You win the round!</span> : <span className="text-rose-400">{opponentName} wins the round!</span>
                  )}
                </h3>
                
                <div className="flex items-center gap-12 mb-12">
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-slate-400 mb-2">You played</span>
                    <div className="text-6xl bg-slate-900 border border-slate-700 w-32 h-32 flex items-center justify-center rounded-2xl shadow-xl shadow-slate-900/50">
                      {renderIcon(roundResult.choices[socket.id || ''])}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-600">VS</div>
                  <div className="flex flex-col items-center">
                    <span className="text-sm text-slate-400 mb-2">{opponentName} played</span>
                    <div className="text-6xl bg-slate-900 border border-slate-700 w-32 h-32 flex items-center justify-center rounded-2xl shadow-xl shadow-slate-900/50">
                      {renderIcon(opponentId ? roundResult.choices[opponentId] : null)}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleNextRound}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-3 rounded-xl font-bold transition-all active:scale-95"
                >
                  Next Round
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-10 text-center">
                  {myPlayer?.choice ? (
                    <span className="text-emerald-400">
                      {opponentIsBot ? `${opponentName} is thinking…` : 'Waiting for opponent…'}
                    </span>
                  ) : (
                    <span>Make your choice</span>
                  )}
                </h2>

                <div className="flex gap-4">
                  {['rock', 'paper', 'scissors'].map((choice) => (
                    <button
                      key={choice}
                      onClick={() => handleChoice(choice)}
                      disabled={!!myPlayer?.choice}
                      className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl text-5xl md:text-6xl flex items-center justify-center border-2 transition-all transform
                        ${myPlayer?.choice === choice 
                          ? 'border-emerald-500 bg-emerald-500/10 scale-110 shadow-lg shadow-emerald-500/20' 
                          : 'border-slate-800 bg-slate-900 hover:border-slate-600 hover:bg-slate-800 hover:scale-105 active:scale-95'
                        }
                        ${myPlayer?.choice && myPlayer.choice !== choice ? 'opacity-30 scale-90 blur-sm' : ''}
                      `}
                    >
                      {renderIcon(choice)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
