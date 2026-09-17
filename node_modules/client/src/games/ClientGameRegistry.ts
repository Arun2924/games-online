import { TicTacToeView } from './TicTacToeView';
import { RockPaperScissorsView } from './RockPaperScissorsView';
import { ReactionView } from './ReactionView';
import { DrawAndGuessView } from './DrawAndGuessView';
import { SpeedQuizView } from './SpeedQuizView';
import type { PlayerAction } from '@gamehub/shared';

export interface GameProps {
  gameState: any;
  players: any[];
  playerId: string;
  onAction: (action: PlayerAction) => void;
}

// Map game IDs to their React component views
export const ClientGameRegistry: Record<string, React.ComponentType<any>> = {
  tictactoe: TicTacToeView,
  rps: RockPaperScissorsView,
  reaction: ReactionView,
  'draw-guess': DrawAndGuessView,
  'speed-quiz': SpeedQuizView
};
