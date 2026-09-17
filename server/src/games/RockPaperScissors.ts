import { ServerGameDefinition } from './GameManager';
import { GameState, PlayerAction } from '@gamehub/shared';

export const RockPaperScissors: ServerGameDefinition = {
  id: 'rps',
  minPlayers: 2,
  maxPlayers: 2,
  botDelayMs: 1200,
  createState: (players: string[]): GameState => {
    return {
      status: 'playing',
      winnerId: null,
      players: {
        [players[0]]: { choice: null, score: 0 },
        [players[1]]: { choice: null, score: 0 }
      },
      state: {
        round: 1,
        maxRounds: 3,
        roundResult: null,
        timer: null
      }
    };
  },
  handleAction: (state: GameState, action: PlayerAction, playerId: string): GameState => {
    if (state.status !== 'playing') return state;

    if (action.type === 'play_move') {
      const choice = action.payload.choice;
      if (!['rock', 'paper', 'scissors'].includes(choice)) return state;
      
      const player = state.players[playerId];
      if (player.choice !== null) return state;

      const newPlayers = {
        ...state.players,
        [playerId]: { ...player, choice }
      };

      const pIds = Object.keys(newPlayers);
      const allChosen = pIds.every(id => newPlayers[id].choice !== null);

      if (allChosen) {
        const p1 = pIds[0];
        const p2 = pIds[1];
        const c1 = newPlayers[p1].choice;
        const c2 = newPlayers[p2].choice;

        let roundWinnerId: string | 'draw' = 'draw';
        if (
          (c1 === 'rock' && c2 === 'scissors') ||
          (c1 === 'paper' && c2 === 'rock') ||
          (c1 === 'scissors' && c2 === 'paper')
        ) {
          roundWinnerId = p1;
          newPlayers[p1].score += 1;
        } else if (
          (c2 === 'rock' && c1 === 'scissors') ||
          (c2 === 'paper' && c1 === 'rock') ||
          (c2 === 'scissors' && c1 === 'paper')
        ) {
          roundWinnerId = p2;
          newPlayers[p2].score += 1;
        }

        const roundResult = {
          winner: roundWinnerId,
          choices: { [p1]: c1, [p2]: c2 }
        };

        const isGameOver = newPlayers[p1].score === 3 || newPlayers[p2].score === 3;
        let gameWinnerId = null;
        if (isGameOver) {
          gameWinnerId = newPlayers[p1].score === 3 ? p1 : p2;
        }

        return {
          ...state,
          status: isGameOver ? 'finished' : 'playing',
          winnerId: gameWinnerId,
          players: newPlayers,
          state: {
            ...state.state,
            roundResult,
            round: state.state.round + 1
          }
        };
      } else {
        return {
          ...state,
          players: newPlayers
        };
      }
    }

    if (action.type === 'next_round') {
      const pIds = Object.keys(state.players);
      return {
        ...state,
        players: {
          [pIds[0]]: { ...state.players[pIds[0]], choice: null },
          [pIds[1]]: { ...state.players[pIds[1]], choice: null }
        },
        state: {
          ...state.state,
          roundResult: null
        }
      };
    }
    
    return state;
  },
  botMove: (state: GameState, botId: string): PlayerAction | null => {
    if (state.status !== 'playing') return null;
    // Only move if no round result is showing and bot hasn't chosen yet
    if (state.state.roundResult) return null;
    if (state.players[botId]?.choice !== null) return null;

    const choices = ['rock', 'paper', 'scissors'];
    const pick = choices[Math.floor(Math.random() * choices.length)];
    return { type: 'play_move', payload: { choice: pick } };
  }
};
