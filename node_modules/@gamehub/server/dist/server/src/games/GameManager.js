"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameManager = exports.GameManager = void 0;
class GameManager {
    games = new Map();
    registerGame(game) {
        this.games.set(game.id, game);
    }
    getGame(gameId) {
        return this.games.get(gameId);
    }
}
exports.GameManager = GameManager;
exports.gameManager = new GameManager();
