import { GameState, PlayerAction } from '../../../shared/src/index';
import { Server, Socket } from 'socket.io';
import { Room } from '../../../shared/src/index';
import { TicTacToe } from './TicTacToe';
import { RockPaperScissors } from './RockPaperScissors';
import { Reaction } from './Reaction';
import { DrawAndGuess } from './DrawAndGuess';
import { SpeedQuiz } from './SpeedQuiz';

export interface ServerGameDefinition {
  id: string;
  minPlayers: number;
  maxPlayers: number;
  createState: (players: string[]) => GameState;
  handleAction: (state: GameState, action: PlayerAction, playerId: string) => GameState;
  getPrivateState?: (state: GameState, playerId: string) => GameState;
  tick?: (state: GameState) => GameState;
  handleCustomEvent?: (room: Room, eventData: any, socket: Socket, io: Server) => void;
  /** Return a PlayerAction for the bot, or null if the bot shouldn't move right now. */
  botMove?: (state: GameState, botId: string) => PlayerAction | null;
  /** Delay in ms before the bot makes its move (to feel human). Default 800. */
  botDelayMs?: number;
}

const factories: Record<string, (io: Server, room: Room, update: any) => any> = {
  'tictactoe': (io, room, update) => new TicTacToe(room, update),
  'rps': (io, room, update) => new RockPaperScissors(room, update),
  'reaction': (io, room, update) => new Reaction(room, update),
  'draw-guess': (io, room, update) => new DrawAndGuess(room, update),
  'speed-quiz': (io, room, update) => new SpeedQuiz(room, update)
};

export class GameManager {
  private games: Map<string, ServerGameDefinition> = new Map();

  registerGame(game: ServerGameDefinition) {
    this.games.set(game.id, game);
  }

  getGame(gameId: string) {
    return this.games.get(gameId);
  }
}

export const gameManager = new GameManager();
