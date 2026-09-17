"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const RoomManager_1 = require("./rooms/RoomManager");
const GameManager_1 = require("./games/GameManager");
const TicTacToe_1 = require("./games/TicTacToe");
const RockPaperScissors_1 = require("./games/RockPaperScissors");
const Reaction_1 = require("./games/Reaction");
const DrawAndGuess_1 = require("./games/DrawAndGuess");
const SpeedQuiz_1 = require("./games/SpeedQuiz");
GameManager_1.gameManager.registerGame(TicTacToe_1.TicTacToe);
GameManager_1.gameManager.registerGame(RockPaperScissors_1.RockPaperScissors);
GameManager_1.gameManager.registerGame(Reaction_1.Reaction);
GameManager_1.gameManager.registerGame(DrawAndGuess_1.DrawAndGuess);
GameManager_1.gameManager.registerGame(SpeedQuiz_1.SpeedQuiz);
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*', // For development
        methods: ['GET', 'POST']
    }
});
const roomManager = new RoomManager_1.RoomManager(io, GameManager_1.gameManager);
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.on('join_room', (data) => {
        roomManager.handleJoinRoom(socket, data);
    });
    socket.on('create_room', (data) => {
        roomManager.handleCreateRoom(socket, data);
    });
    roomManager.setupSocketListeners(socket);
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        roomManager.handleDisconnect(socket);
    });
});
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
