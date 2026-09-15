import { Socket } from 'socket.io-client';

const BOT_ID_PREFIX = 'bot_';

export function TicTacToeView({ room, socket }: { room: any, socket: Socket }) {
  const gameState = room.gameState;
  const board = gameState?.state?.board || Array(9).fill(null);
  const isMyTurn = gameState?.state?.currentTurn === socket.id;
  const currentTurnId = gameState?.state?.currentTurn;
  const currentTurnIsBot = currentTurnId?.startsWith(BOT_ID_PREFIX);
  
  const handleCellClick = (index: number) => {
    if (!isMyTurn || gameState?.status !== 'playing') return;
    if (board[index] !== null) return;

    socket.emit('game_action', {
      type: 'play_move',
      payload: { index }
    });
  };

  const myPlayer = gameState?.players[socket.id || ''];
  const mySymbol = myPlayer?.symbol;
  
  // Find the opponent (could be bot or human)
  const opponentId = Object.keys(gameState?.players || {}).find(id => id !== socket.id);
  const opponentPlayer = room.players.find((p: any) => p.id === opponentId);
  const opponentName = opponentPlayer?.nickname || 'Opponent';
  const opponentIsBot = opponentId?.startsWith(BOT_ID_PREFIX);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      {/* Game Status */}
      <div className="mb-8 text-center h-16 flex flex-col justify-end">
        {gameState?.status === 'finished' ? (
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {gameState.state.isDraw 
                ? <span className="text-amber-400">It's a Draw!</span>
                : gameState.winnerId === socket.id 
                  ? <span className="text-emerald-400">You Won!</span> 
                  : <span className="text-red-400">
                      {opponentIsBot ? `${opponentName} Won!` : 'You Lost!'}
                    </span>
              }
            </h2>
            {room.hostId === socket.id && (
              <button 
                onClick={() => socket.emit('back_to_lobby')}
                className="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors mt-2"
              >
                Play Again
              </button>
            )}
          </div>
        ) : (
          <h2 className="text-2xl font-bold">
            {isMyTurn 
              ? <span className="text-emerald-400">Your Turn ({mySymbol})</span> 
              : <span className="text-slate-400">
                  {currentTurnIsBot ? `${opponentName} is thinking…` : 'Waiting for opponent…'}
                </span>
            }
          </h2>
        )}
      </div>

      {/* Board */}
      <div className="grid grid-cols-3 gap-2 bg-slate-800 p-2 rounded-xl">
        {gameState?.state?.board.map((cell: string | null, index: number) => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            disabled={gameState.status !== 'playing' || cell !== null}
            className={`w-24 h-24 sm:w-32 sm:h-32 bg-slate-950 flex items-center justify-center text-5xl sm:text-7xl font-bold rounded-lg transition-colors
              ${isMyTurn && cell === null && gameState.status === 'playing' ? 'hover:bg-slate-900 cursor-pointer' : 'cursor-default'}
              ${cell === 'X' ? 'text-blue-400' : 'text-rose-400'}
            `}
          >
            {cell}
          </button>
        ))}
      </div>
    </div>
  );
}
