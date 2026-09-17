import { ServerGameDefinition } from './GameManager';
import { GameState, PlayerAction } from '@gamehub/shared';

// ── Minimax AI ──────────────────────────────────────────────
function checkWinner(board: (string | null)[]): string | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function minimax(board: (string | null)[], isMaximizing: boolean, botSymbol: string, humanSymbol: string): number {
  const winner = checkWinner(board);
  if (winner === botSymbol) return 10;
  if (winner === humanSymbol) return -10;
  if (board.every(cell => cell !== null)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = botSymbol;
        best = Math.max(best, minimax(board, false, botSymbol, humanSymbol));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = humanSymbol;
        best = Math.min(best, minimax(board, true, botSymbol, humanSymbol));
        board[i] = null;
      }
    }
    return best;
  }
}

function findBestMove(board: (string | null)[], botSymbol: string, humanSymbol: string): number {
  let bestVal = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = botSymbol;
      const moveVal = minimax(board, false, botSymbol, humanSymbol);
      board[i] = null;
      if (moveVal > bestVal) {
        bestVal = moveVal;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

// ── Game Definition ─────────────────────────────────────────
export const TicTacToe: ServerGameDefinition = {
  id: 'tictactoe',
  minPlayers: 2,
  maxPlayers: 2,
  botDelayMs: 900,
  createState: (players: string[]): GameState => {
    return {
      status: 'playing',
      winnerId: null,
      players: {
        [players[0]]: { symbol: 'X' },
        [players[1]]: { symbol: 'O' }
      },
      state: {
        board: Array(9).fill(null),
        currentTurn: players[0]
      }
    };
  },
  handleAction: (state: GameState, action: PlayerAction, playerId: string): GameState => {
    if (state.status !== 'playing') return state;
    if (state.state.currentTurn !== playerId) return state;

    if (action.type === 'play_move') {
      const index = action.payload.index;
      if (typeof index !== 'number' || index < 0 || index > 8) return state;
      if (state.state.board[index] !== null) return state;

      const symbol = state.players[playerId].symbol;
      const newBoard = [...state.state.board];
      newBoard[index] = symbol;

      // Check win
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
      ];
      
      let winnerId: string | null = null;
      for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
          winnerId = playerId;
          break;
        }
      }

      let isDraw = false;
      if (!winnerId && newBoard.every(cell => cell !== null)) {
        isDraw = true;
      }

      const playerIds = Object.keys(state.players);
      const nextTurn = playerIds.find(id => id !== playerId);

      return {
        ...state,
        status: winnerId || isDraw ? 'finished' : 'playing',
        winnerId: winnerId,
        state: {
          ...state.state,
          board: newBoard,
          currentTurn: winnerId || isDraw ? null : nextTurn,
          isDraw
        }
      };
    }
    
    return state;
  },
  botMove: (state: GameState, botId: string): PlayerAction | null => {
    if (state.status !== 'playing') return null;
    if (state.state.currentTurn !== botId) return null;

    const botSymbol = state.players[botId].symbol;
    const humanId = Object.keys(state.players).find(id => id !== botId)!;
    const humanSymbol = state.players[humanId].symbol;

    const boardCopy = [...state.state.board];
    const bestIndex = findBestMove(boardCopy, botSymbol, humanSymbol);
    if (bestIndex === -1) return null;

    return { type: 'play_move', payload: { index: bestIndex } };
  }
};
