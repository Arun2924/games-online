import { ServerGameDefinition } from './GameManager';
import { GameState, PlayerAction } from '@gamehub/shared';
import { getRandomQuestions } from './speedQuiz/questions';

const QUESTION_TIME_LIMIT_MS = 15000;
const ROUND_DELAY_MS = 5000;

export const SpeedQuiz: ServerGameDefinition = {
  id: 'speed-quiz',
  minPlayers: 1,
  maxPlayers: 6,
  
  createState: (players: string[]): GameState => {
    const playerMap: Record<string, any> = {};
    for (const id of players) {
      playerMap[id] = { score: 0 };
    }
    
    const questions = getRandomQuestions(5);
    
    return {
      status: 'playing',
      winnerId: null,
      players: playerMap,
      state: {
        phase: 'countdown',
        currentRound: 0, // 1-indexed, but countdown makes it 0 initially
        totalRounds: questions.length,
        questions,
        currentQuestion: null,
        questionEndTime: Date.now() + 3000,
        playerAnswers: {},
        leaderboard: []
      }
    };
  },
  
  getPrivateState: (state: GameState, playerId: string): GameState => {
    // Hide the correct answer during playing phase
    if (state.state.phase === 'playing' && state.state.currentQuestion) {
      const privateState = JSON.parse(JSON.stringify(state));
      delete privateState.state.currentQuestion.correctIndex;
      return privateState;
    }
    return state;
  },

  tick: (state: GameState): GameState => {
    if (state.status !== 'playing') return state;
    const now = Date.now();
    
    if (state.state.phase === 'countdown') {
      if (now >= state.state.questionEndTime) {
        return startNextRound(state);
      }
    } else if (state.state.phase === 'playing') {
      const activePlayersCount = Object.keys(state.players).length;
      const answeredCount = Object.keys(state.state.playerAnswers).length;
      
      if (now >= state.state.questionEndTime || (answeredCount >= activePlayersCount && activePlayersCount > 0)) {
        return endRound(state);
      }
    } else if (state.state.phase === 'round_result') {
      if (now >= state.state.questionEndTime) {
        if (state.state.currentRound >= state.state.totalRounds) {
          const sortedPlayers = Object.keys(state.players).sort((a, b) => state.players[b].score - state.players[a].score);
          return {
            ...state,
            status: 'finished',
            winnerId: sortedPlayers[0],
            state: {
              ...state.state,
              phase: 'game_over'
            }
          };
        } else {
          return startNextRound(state);
        }
      }
    }
    
    return state;
  },

  handleAction: (state: GameState, action: PlayerAction, playerId: string): GameState => {
    if (state.status !== 'playing') return state;
    
    if (action.type === 'submit_answer' && state.state.phase === 'playing') {
      if (state.state.playerAnswers[playerId]) return state; // already answered
      
      const answerIndex = action.payload.answerIndex;
      const now = Date.now();
      const timeTakenMs = now - (state.state.questionEndTime - QUESTION_TIME_LIMIT_MS);
      
      const currentQuestion = state.state.currentQuestion;
      const isCorrect = currentQuestion?.correctIndex === answerIndex;
      
      let pointsEarned = 0;
      if (isCorrect) {
        const timeRatio = Math.max(0, 1 - (timeTakenMs / QUESTION_TIME_LIMIT_MS));
        pointsEarned = 10 + Math.floor(timeRatio * 90);
      }
      
      const newState = { ...state };
      newState.state.playerAnswers[playerId] = {
        answerIndex,
        timeTakenMs,
        isCorrect,
        pointsEarned
      };
      newState.players[playerId].score += pointsEarned;
      
      return newState;
    }
    
    return state;
  }
};

function startNextRound(state: GameState): GameState {
  const nextRound = state.state.currentRound + 1;
  const nextQuestion = state.state.questions[nextRound - 1];
  
  return {
    ...state,
    state: {
      ...state.state,
      phase: 'playing',
      currentRound: nextRound,
      currentQuestion: nextQuestion,
      playerAnswers: {},
      questionEndTime: Date.now() + QUESTION_TIME_LIMIT_MS
    }
  };
}

function endRound(state: GameState): GameState {
  const scores = Object.keys(state.players).map(pid => ({
    id: pid,
    score: state.players[pid].score
  }));
  scores.sort((a, b) => b.score - a.score);
  
  return {
    ...state,
    state: {
      ...state.state,
      phase: 'round_result',
      leaderboard: scores,
      questionEndTime: Date.now() + ROUND_DELAY_MS
    }
  };
}
