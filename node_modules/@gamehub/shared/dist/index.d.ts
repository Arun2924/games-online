export interface Player {
    id: string;
    nickname: string;
    avatarSeed: string;
    isReady: boolean;
    score: number;
}
export interface Room {
    id: string;
    hostId: string;
    players: Player[];
    gameId: string | null;
    status: 'lobby' | 'playing' | 'results';
    maxPlayers: number;
    password?: string;
    gameState?: any;
}
export type GameCategory = 'Quiz' | 'Board' | 'Card' | '2D Action' | 'Racing' | 'Arcade' | 'Fighting' | 'Puzzle' | 'Party' | 'Competitive' | 'Reaction / Skill' | 'Drawing / Creativity';
export interface GameDefinition {
    id: string;
    name: string;
    description?: string;
    category: GameCategory;
    icon: string;
    minPlayers: number;
    maxPlayers: number;
    supportedModes: ('Solo' | 'Online')[];
    estimatedDuration: string;
    isComingSoon?: boolean;
}
export declare const gamesRegistry: GameDefinition[];
export interface GameState {
    status: 'playing' | 'finished';
    winnerId?: string | null;
    players: Record<string, any>;
    state: any;
}
export interface PlayerAction {
    type: string;
    payload?: any;
}
