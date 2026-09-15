"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reaction = void 0;
exports.Reaction = {
    id: 'reaction',
    minPlayers: 1,
    maxPlayers: 6,
    createState: (players) => {
        const playerMap = {};
        for (const id of players) {
            playerMap[id] = { score: 0 };
        }
        return {
            status: 'playing',
            winnerId: null,
            players: playerMap,
            state: {
                phase: 'waiting', // waiting, ready, result
                round: 1,
                maxRounds: 5,
                scoreToWin: Math.ceil(5 / 2), // first to 3
                roundWinnerId: null,
                falseStartId: null,
                triggerTime: null,
                reactionTimeMs: null,
                clickedThisRound: [] // track who already clicked
            }
        };
    },
    handleAction: (state, action, playerId) => {
        if (state.status !== 'playing')
            return state;
        if (action.type === 'start_round') {
            if (state.state.phase === 'result' || state.state.phase === 'waiting') {
                const delayMs = Math.floor(Math.random() * 4000) + 2000; // 2-6s
                return {
                    ...state,
                    state: {
                        ...state.state,
                        phase: 'waiting',
                        roundWinnerId: null,
                        falseStartId: null,
                        triggerTime: Date.now() + delayMs,
                        reactionTimeMs: null,
                        clickedThisRound: []
                    }
                };
            }
        }
        if (action.type === 'click') {
            if (state.state.phase === 'result')
                return state;
            // Prevent double-click
            if ((state.state.clickedThisRound || []).includes(playerId))
                return state;
            // Prevent spectators (players not in initial state.players) from participating
            if (!state.players[playerId])
                return state;
            const now = Date.now();
            let roundWinnerId = null;
            let falseStartId = null;
            let reactionTimeMs = null;
            if (state.state.triggerTime && now < state.state.triggerTime) {
                // False start — this player loses the round
                falseStartId = playerId;
                // In multi-player, the round just ends with no winner for this click,
                // but we penalize the clicker by not giving them a point. 
                // For simplicity: false start = round over, no one scores.
                return {
                    ...state,
                    state: {
                        ...state.state,
                        phase: 'result',
                        roundWinnerId: null,
                        falseStartId: playerId,
                        reactionTimeMs: null,
                        round: state.state.round + 1,
                        triggerTime: null,
                        clickedThisRound: [...(state.state.clickedThisRound || []), playerId]
                    }
                };
            }
            // Valid click — first valid click wins the round
            roundWinnerId = playerId;
            reactionTimeMs = now - (state.state.triggerTime || now);
            const newPlayers = { ...state.players };
            newPlayers[roundWinnerId] = { ...newPlayers[roundWinnerId], score: newPlayers[roundWinnerId].score + 1 };
            const scoreToWin = state.state.scoreToWin || 3;
            const isGameOver = newPlayers[roundWinnerId].score >= scoreToWin;
            return {
                ...state,
                status: isGameOver ? 'finished' : 'playing',
                winnerId: isGameOver ? roundWinnerId : null,
                players: newPlayers,
                state: {
                    ...state.state,
                    phase: 'result',
                    roundWinnerId,
                    falseStartId: null,
                    reactionTimeMs,
                    round: state.state.round + 1,
                    triggerTime: null,
                    clickedThisRound: [...(state.state.clickedThisRound || []), playerId]
                }
            };
        }
        return state;
    }
};
