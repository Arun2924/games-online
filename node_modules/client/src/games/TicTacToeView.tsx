import type { Socket } from 'socket.io-client';

const BOT_ID_PREFIX = 'bot_';
const positions = ['Top left', 'Top center', 'Top right', 'Middle left', 'Center', 'Middle right', 'Bottom left', 'Bottom center', 'Bottom right'];

export function TicTacToeView({ room, socket }: { room: any, socket: Socket }) {
  const gameState = room.gameState;
  const board = gameState?.state?.board || Array(9).fill(null);
  const isMyTurn = gameState?.state?.currentTurn === socket.id;
  const currentTurnIsBot = gameState?.state?.currentTurn?.startsWith(BOT_ID_PREFIX);
  const mySymbol = gameState?.players?.[socket.id || '']?.symbol;
  const opponentId = Object.keys(gameState?.players || {}).find(id => id !== socket.id);
  const opponentName = room.players.find((p: any) => p.id === opponentId)?.nickname || 'Opponent';
  const finished = gameState?.status === 'finished';
  const statusText = finished
    ? gameState.state.isDraw ? 'A perfect standoff.' : gameState.winnerId === socket.id ? 'You won.' : `${opponentName} wins.`
    : isMyTurn ? 'Your move.' : currentTurnIsBot ? `${opponentName} is thinking…` : `Waiting for ${opponentName}…`;

  const handleCellClick = (index: number) => {
    if (!isMyTurn || gameState?.status !== 'playing' || board[index] !== null) return;
    socket.emit('game_action', { type: 'play_move', payload: { index } });
  };

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-lg flex-1 flex-col items-center justify-center gap-6 px-3 py-6 sm:p-8">
      <div className="w-full text-center" role="status" aria-atomic="true">
        <p className="eyebrow mb-3">{finished ? 'Final result' : 'Tic tac toe'}</p>
        <h2 className={`font-['Outfit'] text-3xl font-semibold leading-tight tracking-tight break-words sm:text-4xl ${finished ? gameState.state.isDraw ? 'text-amber-400' : gameState.winnerId === socket.id ? 'text-emerald-300' : 'text-rose-400' : 'text-slate-100'}`}>
          {statusText}
        </h2>
        <p className="mt-3 text-sm text-slate-400">{finished ? 'Three in a row. One good game.' : isMyTurn ? 'Choose an empty square to place your mark.' : 'Plan your next move while you wait.'}</p>
      </div>
      <div className="flex w-full max-w-sm items-center justify-between gap-4 border-y border-slate-800 py-3 text-sm">
        <span className="min-w-0 text-slate-300">You <strong className="ml-2 text-emerald-400">{mySymbol || 'Spectator'}</strong></span>
        <span className="min-w-0 truncate text-right text-slate-400">{opponentName} <strong className="ml-2 text-slate-200">{gameState?.players?.[opponentId || '']?.symbol}</strong></span>
      </div>
      <div role="group" aria-label="Tic tac toe board" className="grid w-full max-w-sm grid-cols-3 gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-2 sm:gap-3 sm:p-3">
        {board.map((cell: string | null, index: number) => {
          const available = isMyTurn && cell === null && gameState?.status === 'playing';
          return (
            <button
              key={index}
              type="button"
              aria-label={`${positions[index]}, row ${Math.floor(index / 3) + 1}, column ${index % 3 + 1}: ${cell || 'empty'}`}
              aria-disabled={!available}
              onClick={() => handleCellClick(index)}
              className={`flex aspect-square min-w-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 font-['Outfit'] text-5xl font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 sm:text-7xl ${available ? 'cursor-pointer hover:border-emerald-400/50 hover:bg-slate-800' : 'cursor-default'} ${cell === 'X' ? 'text-emerald-300' : 'text-slate-100'}`}
            >
              {cell}
            </button>
          );
        })}
      </div>
      <p className="text-center text-xs text-slate-400">Tab to a square. Press Enter or Space to play.</p>
    </div>
  );
}
