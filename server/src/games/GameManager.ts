import { GameState, PlayerAction, Room } from '@gamehub/shared';
import { Server, Socket } from 'socket.io';

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
