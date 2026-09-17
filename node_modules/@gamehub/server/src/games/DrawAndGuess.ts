import { ServerGameDefinition } from './GameManager';
import { GameState, PlayerAction } from '@gamehub/shared';
import { getRandomWord } from './drawAndGuess/words';

export const DrawAndGuess: ServerGameDefinition = {
  id: 'draw-guess',
  minPlayers: 2,
  maxPlayers: 6,
  
  createState: (players: string[]): GameState => {
    const playerMap: Record<string, any> = {};
    for (const id of players) {
      playerMap[id] = { score: 0 };
    }
    
    // Configurable defaults
    const maxRounds = players.length;
    
    return {
      status: 'playing',
      winnerId: null,
      players: playerMap,
      state: {
        phase: 'countdown',
        round: 1,
        maxRounds,
        drawerId: players[0],
        drawerQueue: players.slice(1),
        word: getRandomWord(),
        wordLength: 0, 
        endTime: Date.now() + 3000,
        drawHistory: [],
        guesses: [],
        correctGuessers: [],
        roundResults: null
      }
    };
  },
  
  getPrivateState: (state: GameState, playerId: string): GameState => {
    if (state.state.drawerId === playerId || state.state.phase === 'result' || state.state.phase === 'final') {
      return state;
    }
    // Non-drawers during play don't see the word
    return {
      ...state,
      state: {
        ...state.state,
        word: '', 
        wordLength: state.state.word.length
      }
    };
  },

  tick: (state: GameState): GameState => {
    if (state.status !== 'playing') return state;
    const now = Date.now();
    
    // Check if drawer disconnected
    if (!state.players[state.state.drawerId] && state.state.phase === 'playing') {
       return transitionToResults(state);
    }
    
    if (state.state.phase === 'countdown') {
      if (now >= state.state.endTime) {
        return {
          ...state,
          state: {
            ...state.state,
            phase: 'playing',
            endTime: now + 60000,
          }
        };
      }
    } else if (state.state.phase === 'playing') {
      const activePlayersCount = Object.keys(state.players).length;
      if (now >= state.state.endTime || state.state.correctGuessers.length >= activePlayersCount - 1) {
        return transitionToResults(state);
      }
    } else if (state.state.phase === 'result') {
      if (now >= state.state.endTime) {
        if (state.state.round >= state.state.maxRounds) {
          const sortedPlayers = Object.keys(state.players).sort((a, b) => state.players[b].score - state.players[a].score);
          return {
            ...state,
            status: 'finished',
            winnerId: sortedPlayers[0],
            state: {
              ...state.state,
              phase: 'final'
            }
          };
        } else {
          // Next round
          let nextDrawer = state.state.drawerQueue[0];
          const nextQueue = state.state.drawerQueue.slice(1);
          nextQueue.push(state.state.drawerId);
          
          // Ensure nextDrawer is still connected, if not, pick the next one
          while (nextDrawer && !state.players[nextDrawer] && nextQueue.length > 0) {
              nextDrawer = nextQueue[0];
              nextQueue.shift();
          }
          
          if (!nextDrawer || !state.players[nextDrawer]) {
             // Everyone left?
             return {
                ...state,
                status: 'finished',
                state: { ...state.state, phase: 'final' }
             };
          }

          return {
            ...state,
            state: {
              ...state.state,
              phase: 'countdown',
              round: state.state.round + 1,
              drawerId: nextDrawer,
              drawerQueue: nextQueue,
              word: getRandomWord(),
              endTime: now + 3000,
              drawHistory: [],
              guesses: [],
              correctGuessers: [],
              roundResults: null
            }
          };
        }
      }
    }
    
    return state;
  },

  handleAction: (state: GameState, action: PlayerAction, playerId: string): GameState => {
    if (state.status !== 'playing' || state.state.phase !== 'playing') return state;
    
    if (action.type === 'guess') {
      console.log('Server received guess action:', action, 'from player:', playerId);
      if (playerId === state.state.drawerId) return state; // Drawer cannot guess
      if (state.state.correctGuessers.includes(playerId)) return state; // Already got it
      
      const text = (action.payload?.text || '').trim();
      if (!text) return state;
      
      const isCorrect = text.toLowerCase() === state.state.word.toLowerCase();
      
      const newGuesses = [...state.state.guesses, { id: Math.random().toString(36).substring(2, 9), playerId, text, isCorrect }];
      
      if (isCorrect) {
        const timeLeft = Math.max(0, state.state.endTime - Date.now());
        const points = Math.floor(50 + (50 * (timeLeft / 60000)));
        const drawerPoints = 20;
        
        const newPlayers = { ...state.players };
        newPlayers[playerId] = { ...newPlayers[playerId], score: newPlayers[playerId].score + points };
        newPlayers[state.state.drawerId] = { ...newPlayers[state.state.drawerId], score: newPlayers[state.state.drawerId].score + drawerPoints };
        
        return {
          ...state,
          players: newPlayers,
          state: {
            ...state.state,
            guesses: newGuesses,
            correctGuessers: [...state.state.correctGuessers, playerId]
          }
        };
      } else {
        return {
          ...state,
          state: {
            ...state.state,
            guesses: newGuesses
          }
        };
      }
    }
    
    return state;
  },
  
  handleCustomEvent: (room, eventData, socket, io) => {
    if (!room.gameState || room.gameState.state.phase !== 'playing') return;
    if (socket.id !== room.gameState.state.drawerId) return; // Only drawer can draw
    
    if (eventData.type === 'draw' || eventData.type === 'clear' || eventData.type === 'undo') {
      if (eventData.type === 'clear') {
         room.gameState.state.drawHistory = [];
      } else if (eventData.type === 'undo') {
         if (eventData.strokeId) {
             room.gameState.state.drawHistory = room.gameState.state.drawHistory.filter((stroke: any) => stroke.strokeId !== eventData.strokeId);
         }
      } else {
         room.gameState.state.drawHistory.push(eventData);
      }
      
      socket.to(room.id).emit('game_custom_event', eventData);
    }
  }
};

function transitionToResults(state: GameState): GameState {
  return {
    ...state,
    state: {
      ...state.state,
      phase: 'result',
      endTime: Date.now() + 5000,
      roundResults: {
        word: state.state.word,
      }
    }
  };
}
