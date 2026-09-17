import { Server, Socket } from 'socket.io';
import { Player, Room, PlayerAction } from '@gamehub/shared';
import { GameManager } from '../games/GameManager';

const BOT_ID_PREFIX = 'bot_';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private socketToRoom: Map<string, string> = new Map();
  private io: Server;
  private gameManager: GameManager;
  private botTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(io: Server, gameManager: GameManager) {
    this.io = io;
    this.gameManager = gameManager;
    setInterval(() => this.tickRooms(), 1000);
  }

  private tickRooms() {
    for (const room of this.rooms.values()) {
      if (room.status === 'playing' && room.gameId && room.gameState) {
        const gameDef = this.gameManager.getGame(room.gameId);
        if (gameDef && gameDef.tick) {
          const newState = gameDef.tick(room.gameState);
          if (newState !== room.gameState) {
             room.gameState = newState;
             this.broadcastRoomState(room);
          }
        }
      }
    }
  }

  private getRoomForPlayer(room: Room, playerId: string): Room {
    if (!room.gameId || !room.gameState) return room;
    const gameDef = this.gameManager.getGame(room.gameId);
    if (gameDef && gameDef.getPrivateState) {
      return {
        ...room,
        gameState: gameDef.getPrivateState(room.gameState, playerId)
      };
    }
    return room;
  }

  private broadcastRoomState(room: Room) {
    if (!room.gameId) {
      this.io.to(room.id).emit('room_state_update', room);
      return;
    }
    const gameDef = this.gameManager.getGame(room.gameId);
    if (gameDef && gameDef.getPrivateState) {
      this.io.in(room.id).fetchSockets().then(sockets => {
        for (const s of sockets) {
          s.emit('room_state_update', this.getRoomForPlayer(room, s.id));
        }
      });
    } else {
      this.io.to(room.id).emit('room_state_update', room);
    }
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private isBot(playerId: string): boolean {
    return playerId.startsWith(BOT_ID_PREFIX);
  }

  // ── Bot scheduling ────────────────────────────────────────
  private scheduleBotMove(room: Room) {
    if (!room.gameId || !room.gameState || room.status !== 'playing') return;

    const gameDef = this.gameManager.getGame(room.gameId);
    if (!gameDef || !gameDef.botMove) return;

    // Find all bot players
    const botIds = room.players.filter(p => this.isBot(p.id)).map(p => p.id);
    if (botIds.length === 0) return;

    for (const botId of botIds) {
      const action = gameDef.botMove(room.gameState, botId);
      if (action) {
        const delay = gameDef.botDelayMs ?? 800;
        const timerKey = `${room.id}_${botId}`;

        // Clear any existing timer for this bot
        if (this.botTimers.has(timerKey)) {
          clearTimeout(this.botTimers.get(timerKey)!);
        }

        const timer = setTimeout(() => {
          this.botTimers.delete(timerKey);
          // Re-fetch room in case state changed
          const currentRoom = this.rooms.get(room.id);
          if (!currentRoom || currentRoom.status !== 'playing' || !currentRoom.gameState) return;

          const currentGameDef = this.gameManager.getGame(currentRoom.gameId!);
          if (!currentGameDef) return;

          const newState = currentGameDef.handleAction(currentRoom.gameState, action, botId);
          currentRoom.gameState = newState;
          this.broadcastRoomState(currentRoom);

          // After bot moves, check if another bot needs to move
          this.scheduleBotMove(currentRoom);
        }, delay);

        this.botTimers.set(timerKey, timer);
      }
    }
  }

  private clearBotTimers(roomId: string) {
    for (const [key, timer] of this.botTimers.entries()) {
      if (key.startsWith(roomId)) {
        clearTimeout(timer);
        this.botTimers.delete(key);
      }
    }
  }

  // ── Room management ───────────────────────────────────────
  public handleCreateRoom(socket: Socket, data: { nickname: string; avatarSeed: string; maxPlayers?: number; gameId?: string; solo?: boolean }) {
    let roomId = this.generateRoomCode();
    while (this.rooms.has(roomId)) {
      roomId = this.generateRoomCode();
    }

    const host: Player = {
      id: socket.id,
      nickname: data.nickname,
      avatarSeed: data.avatarSeed,
      isReady: false,
      score: 0
    };

    const gameDef = data.gameId ? this.gameManager.getGame(data.gameId) : undefined;
    const maxPlayers = gameDef ? gameDef.maxPlayers : (data.maxPlayers || 6);

    const room: Room = {
      id: roomId,
      hostId: socket.id,
      players: [host],
      gameId: data.gameId || null,
      status: 'lobby',
      maxPlayers: maxPlayers
    };

    // If solo mode, add a bot player
    if (data.solo && data.gameId) {
      const botNames = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta', 'Bot Epsilon'];
      const botName = botNames[Math.floor(Math.random() * botNames.length)];
      const bot: Player = {
        id: `${BOT_ID_PREFIX}${roomId}_1`,
        nickname: botName,
        avatarSeed: `bot-${Math.random().toString(36).slice(2, 8)}`,
        isReady: true,
        score: 0
      };
      room.players.push(bot);
    }

    this.rooms.set(roomId, room);
    this.socketToRoom.set(socket.id, roomId);
    socket.join(roomId);

    socket.emit('room_created', room);
  }

  public handleJoinRoom(socket: Socket, data: { roomId?: string; nickname: string; avatarSeed: string }) {
    if (!data.roomId) {
      socket.emit('error', { message: 'Room ID is required' });
      return;
    }
    const roomId = data.roomId.toUpperCase();
    const room = this.rooms.get(roomId);

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Check if player is already in room (reconnection)
    const existingPlayer = room.players.find(p => !this.isBot(p.id) && p.nickname === data.nickname && p.avatarSeed === data.avatarSeed);
    
    if (existingPlayer) {
      this.socketToRoom.delete(existingPlayer.id);
      if (room.hostId === existingPlayer.id) {
        room.hostId = socket.id;
      }
      existingPlayer.id = socket.id;
      this.socketToRoom.set(socket.id, roomId);
      socket.join(roomId);
      
      socket.emit('room_joined', this.getRoomForPlayer(room, socket.id));
      this.broadcastRoomState(room);
      return;
    }

    if (room.status !== 'lobby') {
      socket.emit('error', { message: 'Game already in progress' });
      return;
    }

    // Count real (non-bot) players for capacity
    const realPlayerCount = room.players.filter(p => !this.isBot(p.id)).length;
    if (realPlayerCount >= room.maxPlayers) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    const player: Player = {
      id: socket.id,
      nickname: data.nickname,
      avatarSeed: data.avatarSeed,
      isReady: false,
      score: 0
    };

    room.players.push(player);
    this.socketToRoom.set(socket.id, roomId);
    socket.join(roomId);

    socket.to(roomId).emit('player_joined', player);
    socket.emit('room_joined', room);
  }

  public handleDisconnect(socket: Socket) {
    const roomId = this.socketToRoom.get(socket.id);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);
    this.socketToRoom.delete(socket.id);

    // Only real players left?
    const realPlayers = room.players.filter(p => !this.isBot(p.id));
    if (realPlayers.length === 0) {
      this.clearBotTimers(roomId);
      this.rooms.delete(roomId);
      return;
    }

    if (room.hostId === socket.id) {
      room.hostId = realPlayers[0].id;
      this.io.to(roomId).emit('host_migrated', room.hostId);
    }

    if (room.gameState && room.gameState.players[socket.id]) {
      delete room.gameState.players[socket.id];
      this.broadcastRoomState(room);
    }

    this.io.to(roomId).emit('player_left', socket.id);
  }

  // ── Socket events ─────────────────────────────────────────
  public setupSocketListeners(socket: Socket) {
    socket.on('toggle_ready', () => {
      const roomId = this.socketToRoom.get(socket.id);
      if (!roomId) return;
      const room = this.rooms.get(roomId);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.isReady = !player.isReady;
        this.io.to(roomId).emit('ready_changed', { playerId: socket.id, isReady: player.isReady });
      }
    });

    socket.on('send_chat', (data: { text: string }) => {
      if (!data.text || data.text.length > 100) return;
      const roomId = this.socketToRoom.get(socket.id);
      if (!roomId) return;
      const room = this.rooms.get(roomId);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        this.io.to(roomId).emit('chat_message', { author: player.nickname, text: data.text });
      }
    });

    socket.on('start_game', () => {
      const roomId = this.socketToRoom.get(socket.id);
      if (!roomId) return;
      const room = this.rooms.get(roomId);
      if (!room) return;

      if (room.hostId !== socket.id) return;
      if (!room.players.every(p => p.isReady)) return;
      
      if (!room.gameId) {
        socket.emit('error', { message: 'No game selected' });
        return;
      }
      
      const gameDef = this.gameManager.getGame(room.gameId);
      if (!gameDef) {
        socket.emit('error', { message: 'Invalid game' });
        return;
      }

      if (room.players.length < gameDef.minPlayers) {
        socket.emit('error', { message: `Not enough players. Need at least ${gameDef.minPlayers}.` });
        return;
      }

      room.status = 'playing';
      
      room.gameState = gameDef.createState(room.players.map(p => p.id));
      
      this.broadcastRoomState(room);

      // Schedule bot moves if applicable
      this.scheduleBotMove(room);
    });

    socket.on('game_action', (action: PlayerAction) => {
      console.log('RoomManager received game_action:', action);
      const roomId = this.socketToRoom.get(socket.id);
      if (!roomId) {
        console.log('No roomId for socket:', socket.id);
        return;
      }
      const room = this.rooms.get(roomId);
      if (!room || room.status !== 'playing' || !room.gameId || !room.gameState) {
        console.log('Room invalid for game_action:', { roomStatus: room?.status, gameId: room?.gameId, hasGameState: !!room?.gameState });
        return;
      }

      const gameDef = this.gameManager.getGame(room.gameId);
      if (gameDef) {
        // Prevent spectators/mid-game joiners from sending actions
        if (!room.gameState.players[socket.id]) {
            console.log('Player not in game state players map:', socket.id);
            return;
        }

        const newState = gameDef.handleAction(room.gameState, action, socket.id);
        room.gameState = newState;
        this.broadcastRoomState(room);

        // After a human move, schedule any bot follow-up
        this.scheduleBotMove(room);
      }
    });

    socket.on('back_to_lobby', () => {
      const roomId = this.socketToRoom.get(socket.id);
      if (!roomId) return;
      const room = this.rooms.get(roomId);
      if (!room || room.hostId !== socket.id) return;

      this.clearBotTimers(roomId);

      room.status = 'lobby';
      room.gameState = undefined;
      room.players.forEach(p => {
        if (this.isBot(p.id)) {
          p.isReady = true; // bots always ready
        } else {
          p.isReady = false;
        }
      });
      
      this.broadcastRoomState(room);
    });
    socket.on('game_custom_event', (eventData: any) => {
      const roomId = this.socketToRoom.get(socket.id);
      if (!roomId) return;
      const room = this.rooms.get(roomId);
      if (!room || room.status !== 'playing' || !room.gameId || !room.gameState) return;

      const gameDef = this.gameManager.getGame(room.gameId);
      if (gameDef && gameDef.handleCustomEvent) {
        // Prevent spectators/mid-game joiners from sending actions
        if (!room.gameState.players[socket.id]) return;
        gameDef.handleCustomEvent(room, eventData, socket, this.io);
      }
    });
  }
}
