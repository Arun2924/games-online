import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './rooms/RoomManager';
import { gameManager } from './games/GameManager';
import { TicTacToe } from './games/TicTacToe';
import { RockPaperScissors } from './games/RockPaperScissors';
import { Reaction } from './games/Reaction';
import { DrawAndGuess } from './games/DrawAndGuess';

gameManager.registerGame(TicTacToe);
gameManager.registerGame(RockPaperScissors);
gameManager.registerGame(Reaction);
gameManager.registerGame(DrawAndGuess);

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For development
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager(io, gameManager);

io.on('connection', (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('join_room', (data: { roomId?: string; nickname: string; avatarSeed: string }) => {
    roomManager.handleJoinRoom(socket, data);
  });
  
  socket.on('create_room', (data: { nickname: string; avatarSeed: string; maxPlayers?: number; gameId?: string }) => {
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
