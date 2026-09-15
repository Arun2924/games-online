"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gamesRegistry = void 0;
exports.gamesRegistry = [
    // --- ACTIVE GAMES ---
    {
        id: 'tictactoe',
        name: 'Tic Tac Toe',
        description: 'The classic game of Xs and Os. Play against a friend or challenge our AI bot.',
        category: 'Board',
        icon: '♟️',
        minPlayers: 1,
        maxPlayers: 2,
        supportedModes: ['Solo', 'Online'],
        estimatedDuration: '2–5 min'
    },
    {
        id: 'rps',
        name: 'Rock Paper Scissors',
        description: 'A simple battle of minds. Best of 5 — can you outsmart the bot?',
        category: 'Party',
        icon: '✌️',
        minPlayers: 1,
        maxPlayers: 2,
        supportedModes: ['Solo', 'Online'],
        estimatedDuration: '1–3 min'
    },
    {
        id: 'reaction',
        name: 'Reaction Challenge',
        description: 'Who has the fastest reflexes? Play solo to beat your own time, or compete with up to 6 friends.',
        category: 'Reaction / Skill',
        icon: '⚡',
        minPlayers: 1,
        maxPlayers: 6,
        supportedModes: ['Solo', 'Online'],
        estimatedDuration: '1 min'
    },
    // --- COMING SOON (PLACEHOLDERS) ---
    {
        id: 'trivia-quiz',
        name: 'Brain Battle Quiz',
        category: 'Quiz',
        icon: '🧠',
        minPlayers: 2,
        maxPlayers: 6,
        supportedModes: ['Online'],
        estimatedDuration: '5–10 min',
        isComingSoon: true
    },
    {
        id: 'poker-lite',
        name: 'Poker Lite',
        category: 'Card',
        icon: '🃏',
        minPlayers: 2,
        maxPlayers: 6,
        supportedModes: ['Online'],
        estimatedDuration: '10–20 min',
        isComingSoon: true
    },
    {
        id: 'pixel-fighter',
        name: 'Pixel Brawler',
        category: 'Fighting',
        icon: '🥊',
        minPlayers: 2,
        maxPlayers: 2,
        supportedModes: ['Online'],
        estimatedDuration: '3–5 min',
        isComingSoon: true
    },
    {
        id: 'draw-guess',
        name: 'Draw & Guess',
        description: 'A multiplayer drawing and guessing game. Guess the word to earn points!',
        category: 'Drawing / Creativity',
        icon: '🎨',
        minPlayers: 2,
        maxPlayers: 6,
        supportedModes: ['Online'],
        estimatedDuration: '5–15 min'
    },
    {
        id: 'mini-karts',
        name: 'Micro Karts',
        category: 'Racing',
        icon: '🏎️',
        minPlayers: 2,
        maxPlayers: 4,
        supportedModes: ['Online'],
        estimatedDuration: '3–5 min',
        isComingSoon: true
    },
    {
        id: 'tower-stack',
        name: 'Tower Stacker',
        category: 'Puzzle',
        icon: '🏗️',
        minPlayers: 1,
        maxPlayers: 4,
        supportedModes: ['Solo', 'Online'],
        estimatedDuration: '2–5 min',
        isComingSoon: true
    },
    {
        id: 'retro-snake',
        name: 'Snake VS',
        category: 'Arcade',
        icon: '🐍',
        minPlayers: 1,
        maxPlayers: 4,
        supportedModes: ['Solo', 'Online'],
        estimatedDuration: '2–5 min',
        isComingSoon: true
    },
    {
        id: 'sumo-push',
        name: 'Sumo Push',
        category: 'Competitive',
        icon: '🥋',
        minPlayers: 2,
        maxPlayers: 2,
        supportedModes: ['Online'],
        estimatedDuration: '1–2 min',
        isComingSoon: true
    },
    {
        id: 'platform-dash',
        name: 'Platform Dash',
        category: '2D Action',
        icon: '🏃',
        minPlayers: 2,
        maxPlayers: 4,
        supportedModes: ['Online'],
        estimatedDuration: '5 min',
        isComingSoon: true
    }
];
