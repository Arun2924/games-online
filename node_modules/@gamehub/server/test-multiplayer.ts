/**
 * Integration test: simulates multiplayer and solo flows via Socket.IO.
 * Run with: npx tsx test-multiplayer.ts
 * 
 * Requires the server to be running on port 3001.
 */

import { io, Socket } from 'socket.io-client';

const SERVER = 'http://localhost:3001';

function createClient(): Socket {
  return io(SERVER, { autoConnect: false, transports: ['websocket'] });
}

function waitForEvent(socket: Socket, event: string, timeoutMs = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for "${event}"`)), timeoutMs);
    socket.once(event, (data: any) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

/** Collect ALL room_state_update events within a time window. */
function collectUpdates(socket: Socket, durationMs: number): Promise<any[]> {
  return new Promise((resolve) => {
    const updates: any[] = [];
    const handler = (data: any) => updates.push(data);
    socket.on('room_state_update', handler);
    setTimeout(() => {
      socket.off('room_state_update', handler);
      resolve(updates);
    }, durationMs);
  });
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.log(`  ❌ FAIL: ${message}`);
  }
}

async function testSoloTicTacToe() {
  console.log('\n🤖 SOLO TIC TAC TOE (vs Bot)');
  console.log('─'.repeat(50));

  const client = createClient();
  client.connect();
  await sleep(200);
  assert(client.connected, 'Client connected to server');

  // Create solo room
  const roomPromise = waitForEvent(client, 'room_created');
  client.emit('create_room', {
    nickname: 'Tester',
    avatarSeed: 'test123',
    gameId: 'tictactoe',
    maxPlayers: 6,
    solo: true
  });

  const room = await roomPromise;
  assert(room.id.length === 6, 'Room code is 6 chars');
  assert(room.players.length === 2, 'Room has 2 players (human + bot)');

  const bot = room.players.find((p: any) => p.id.startsWith('bot_'));
  assert(bot !== undefined, 'Bot player exists in room');
  assert(bot.isReady === true, 'Bot is auto-ready');
  assert(bot.nickname.startsWith('Bot'), 'Bot has a bot name');

  // Ready up and start
  client.emit('toggle_ready');
  await sleep(200);

  const statePromise = waitForEvent(client, 'room_state_update');
  client.emit('start_game');
  const gameRoom = await statePromise;

  assert(gameRoom.status === 'playing', 'Game starts playing');
  assert(gameRoom.gameState !== undefined, 'Game state exists');
  assert(gameRoom.gameState.state.board.length === 9, 'Board has 9 cells');
  assert(gameRoom.gameState.state.currentTurn === client.id, 'Human goes first (X)');

  // Make a move at center. Collect updates for 2s to catch both human and bot moves.
  const updates = collectUpdates(client, 2000);
  client.emit('game_action', { type: 'play_move', payload: { index: 4 } });
  const allUpdates = await updates;

  assert(allUpdates.length >= 2, 'Received at least 2 updates (human move + bot move)');
  const last = allUpdates[allUpdates.length - 1];
  assert(last.gameState.state.board[4] === 'X', 'Human placed X at center');
  const botMoves = last.gameState.state.board.filter((c: any) => c === 'O').length;
  assert(botMoves === 1, 'Bot made exactly one move (placed O)');
  assert(last.gameState.state.currentTurn === client.id, 'Turn returns to human after bot move');

  client.disconnect();
  console.log('  ✅ Solo TicTacToe flow complete');
}

async function testMultiplayerTicTacToe() {
  console.log('\n👥 MULTIPLAYER TIC TAC TOE');
  console.log('─'.repeat(50));

  const host = createClient();
  const guest = createClient();
  host.connect();
  guest.connect();
  await sleep(200);

  assert(host.connected, 'Host connected');
  assert(guest.connected, 'Guest connected');

  // Host creates room
  const roomPromise = waitForEvent(host, 'room_created');
  host.emit('create_room', {
    nickname: 'Host',
    avatarSeed: 'host1',
    gameId: 'tictactoe',
    maxPlayers: 6
  });
  const room = await roomPromise;
  assert(room.players.length === 1, 'Room starts with 1 player');

  // Guest joins
  const joinPromise = waitForEvent(guest, 'room_joined');
  const hostNotifyPromise = waitForEvent(host, 'player_joined');
  guest.emit('join_room', {
    nickname: 'Guest',
    avatarSeed: 'guest1',
    roomId: room.id
  });
  const joinedRoom = await joinPromise;
  const joinedPlayer = await hostNotifyPromise;

  assert(joinedRoom.players.length === 2, 'Guest sees 2 players');
  assert(joinedPlayer.nickname === 'Guest', 'Host received guest join notification');

  // Both ready up
  host.emit('toggle_ready');
  guest.emit('toggle_ready');
  await sleep(300);

  // Host starts game
  const hostGamePromise = waitForEvent(host, 'room_state_update');
  const guestGamePromise = waitForEvent(guest, 'room_state_update');
  host.emit('start_game');

  const hostGame = await hostGamePromise;
  const guestGame = await guestGamePromise;

  assert(hostGame.status === 'playing', 'Host sees game start');
  assert(guestGame.status === 'playing', 'Guest sees game start');

  const hostId = host.id!;
  const guestId = guest.id!;
  assert(hostGame.gameState.state.currentTurn === hostId, 'Host goes first');

  // Host plays center
  const move1Promise = waitForEvent(guest, 'room_state_update');
  host.emit('game_action', { type: 'play_move', payload: { index: 4 } });
  const afterMove1 = await move1Promise;
  assert(afterMove1.gameState.state.board[4] === 'X', 'Host placed X at center');
  assert(afterMove1.gameState.state.currentTurn === guestId, 'Turn passes to guest');

  // Guest plays corner
  const move2Promise = waitForEvent(host, 'room_state_update');
  guest.emit('game_action', { type: 'play_move', payload: { index: 0 } });
  const afterMove2 = await move2Promise;
  assert(afterMove2.gameState.state.board[0] === 'O', 'Guest placed O at corner');
  assert(afterMove2.gameState.state.currentTurn === hostId, 'Turn passes back to host');

  // Test wrong turn — guest tries to move on host's turn. 
  // The server should silently ignore it. We verify the board doesn't change.
  guest.emit('game_action', { type: 'play_move', payload: { index: 1 } });
  await sleep(300);
  // Board should still have only 2 pieces
  // We can't easily check without another mechanism, so let's verify by having host make a valid move
  const move3Promise = waitForEvent(guest, 'room_state_update');
  host.emit('game_action', { type: 'play_move', payload: { index: 1 } });
  const afterMove3 = await move3Promise;
  assert(afterMove3.gameState.state.board[1] === 'X', 'Host can still play (wrong turn was ignored)');
  // Cell 1 is X (not O), meaning guest's wrong-turn move was properly rejected
  assert(afterMove3.gameState.state.board.filter((c: any) => c !== null).length === 3, 'Only 3 pieces on board (wrong turn rejected)');

  host.disconnect();
  guest.disconnect();
  console.log('  ✅ Multiplayer TicTacToe flow complete');
}

async function testMultiplayerRPS() {
  console.log('\n✌️ MULTIPLAYER ROCK PAPER SCISSORS');
  console.log('─'.repeat(50));

  const host = createClient();
  const guest = createClient();
  host.connect();
  guest.connect();
  await sleep(200);

  // Create and join
  const roomPromise = waitForEvent(host, 'room_created');
  host.emit('create_room', { nickname: 'P1', avatarSeed: 'p1', gameId: 'rps' });
  const room = await roomPromise;

  const joinPromise = waitForEvent(guest, 'room_joined');
  guest.emit('join_room', { nickname: 'P2', avatarSeed: 'p2', roomId: room.id });
  await joinPromise;

  // Ready and start
  host.emit('toggle_ready');
  guest.emit('toggle_ready');
  await sleep(300);

  const startPromise = waitForEvent(host, 'room_state_update');
  host.emit('start_game');
  const started = await startPromise;
  assert(started.gameState.status === 'playing', 'RPS game started');

  // Collect updates on host side for 2 seconds while both players choose
  const updates = collectUpdates(host, 2000);
  host.emit('game_action', { type: 'play_move', payload: { choice: 'rock' } });
  await sleep(100);
  guest.emit('game_action', { type: 'play_move', payload: { choice: 'scissors' } });
  
  const allUpdates = await updates;
  // Find the update with the round result
  const resultUpdate = allUpdates.find(u => u.gameState?.state?.roundResult !== null);
  assert(resultUpdate !== undefined, 'Round result was generated');
  if (resultUpdate) {
    assert(resultUpdate.gameState.state.roundResult.winner === host.id, 'Rock beats scissors (host wins round)');
    assert(resultUpdate.gameState.players[host.id!].score === 1, 'Host score is 1');
    assert(resultUpdate.gameState.players[guest.id!].score === 0, 'Guest score is 0');
  }

  host.disconnect();
  guest.disconnect();
  console.log('  ✅ Multiplayer RPS flow complete');
}

async function testSoloRPS() {
  console.log('\n🤖 SOLO RPS (vs Bot)');
  console.log('─'.repeat(50));

  const client = createClient();
  client.connect();
  await sleep(200);

  const roomPromise = waitForEvent(client, 'room_created');
  client.emit('create_room', { nickname: 'Solo', avatarSeed: 's1', gameId: 'rps', solo: true });
  const room = await roomPromise;

  const bot = room.players.find((p: any) => p.id.startsWith('bot_'));
  assert(bot !== undefined, 'Bot added to RPS room');

  // Ready and start
  client.emit('toggle_ready');
  await sleep(200);
  const startPromise = waitForEvent(client, 'room_state_update');
  client.emit('start_game');
  await startPromise;

  // Human makes choice, collect updates for 3s to catch bot response
  const updates = collectUpdates(client, 3000);
  client.emit('game_action', { type: 'play_move', payload: { choice: 'rock' } });
  const allUpdates = await updates;

  const resultUpdate = allUpdates.find(u => u.gameState?.state?.roundResult !== null);
  assert(resultUpdate !== undefined, 'Bot responded and round resolved');
  if (resultUpdate) {
    const botId = Object.keys(resultUpdate.gameState.state.roundResult.choices).find((id: string) => id.startsWith('bot_'));
    assert(botId !== undefined, 'Bot\'s choice is in the round result');
    const botChoice = resultUpdate.gameState.state.roundResult.choices[botId!];
    assert(['rock', 'paper', 'scissors'].includes(botChoice), 'Bot made a valid choice: ' + botChoice);
  }

  client.disconnect();
  console.log('  ✅ Solo RPS flow complete');
}

async function testRoomManagement() {
  console.log('\n🏠 ROOM MANAGEMENT');
  console.log('─'.repeat(50));

  const host = createClient();
  const guest = createClient();
  host.connect();
  guest.connect();
  await sleep(200);

  // Create room
  const roomPromise = waitForEvent(host, 'room_created');
  host.emit('create_room', { nickname: 'Host', avatarSeed: 'h1', gameId: 'tictactoe' });
  const room = await roomPromise;
  assert(room.id.length === 6, 'Room code generated');

  // Guest joins
  const joinPromise = waitForEvent(guest, 'room_joined');
  guest.emit('join_room', { nickname: 'Guest', avatarSeed: 'g1', roomId: room.id });
  await joinPromise;

  // Chat
  const chatPromise = waitForEvent(guest, 'chat_message');
  host.emit('send_chat', { text: 'Hello!' });
  const chatMsg = await chatPromise;
  assert(chatMsg.author === 'Host', 'Chat message has correct author');
  assert(chatMsg.text === 'Hello!', 'Chat message has correct text');

  // Host migration on disconnect
  const migratePromise = waitForEvent(guest, 'host_migrated');
  host.disconnect();
  const newHostId = await migratePromise;
  assert(newHostId === guest.id, 'Host migrates to remaining player');

  guest.disconnect();
  console.log('  ✅ Room management flow complete');
}

async function testErrorHandling() {
  console.log('\n🚫 ERROR HANDLING');
  console.log('─'.repeat(50));

  const client = createClient();
  client.connect();
  await sleep(200);

  const errorPromise = waitForEvent(client, 'error');
  client.emit('join_room', { nickname: 'Test', avatarSeed: 't1', roomId: 'XXXXXX' });
  const error = await errorPromise;
  assert(error.message === 'Room not found', 'Joining non-existent room returns error');

  client.disconnect();
  console.log('  ✅ Error handling complete');
}

async function testBackToLobby() {
  console.log('\n🔄 BACK TO LOBBY');
  console.log('─'.repeat(50));

  const client = createClient();
  client.connect();
  await sleep(200);

  const roomPromise = waitForEvent(client, 'room_created');
  client.emit('create_room', { nickname: 'Tester', avatarSeed: 't1', gameId: 'tictactoe', solo: true });
  const room = await roomPromise;

  client.emit('toggle_ready');
  await sleep(200);

  const startPromise = waitForEvent(client, 'room_state_update');
  client.emit('start_game');
  const playing = await startPromise;
  assert(playing.status === 'playing', 'Game is playing');

  // Back to lobby
  // Collect updates for 2s because the bot might also trigger an update
  const updates = collectUpdates(client, 1500);
  client.emit('back_to_lobby');
  const allUpdates = await updates;
  
  const lobbyUpdate = allUpdates.find(u => u.status === 'lobby');
  assert(lobbyUpdate !== undefined, 'Back to lobby update received');
  if (lobbyUpdate) {
    assert(lobbyUpdate.gameState === undefined || lobbyUpdate.gameState === null, 'Game state cleared');
    const human = lobbyUpdate.players.find((p: any) => !p.id.startsWith('bot_'));
    const bot = lobbyUpdate.players.find((p: any) => p.id.startsWith('bot_'));
    assert(human.isReady === false, 'Human ready state reset');
    assert(bot.isReady === true, 'Bot remains ready');
  }

  client.disconnect();
  console.log('  ✅ Back to lobby flow complete');
}

async function testFullGameToCompletion() {
  console.log('\n🏆 FULL GAME TO COMPLETION');
  console.log('─'.repeat(50));

  const host = createClient();
  const guest = createClient();
  host.connect();
  guest.connect();
  await sleep(200);

  // Create RPS room
  const roomPromise = waitForEvent(host, 'room_created');
  host.emit('create_room', { nickname: 'Alice', avatarSeed: 'a1', gameId: 'rps' });
  const room = await roomPromise;

  const joinPromise = waitForEvent(guest, 'room_joined');
  guest.emit('join_room', { nickname: 'Bob', avatarSeed: 'b1', roomId: room.id });
  await joinPromise;

  host.emit('toggle_ready');
  guest.emit('toggle_ready');
  await sleep(300);

  const startPromise = waitForEvent(host, 'room_state_update');
  host.emit('start_game');
  await startPromise;

  // Play 3 rounds: host always picks rock, guest always picks scissors → host wins 3-0
  for (let round = 0; round < 3; round++) {
    const updates = collectUpdates(host, 1500);
    host.emit('game_action', { type: 'play_move', payload: { choice: 'rock' } });
    await sleep(50);
    guest.emit('game_action', { type: 'play_move', payload: { choice: 'scissors' } });
    const roundUpdates = await updates;
    
    const resultUpdate = roundUpdates.find(u => u.gameState?.state?.roundResult !== null);
    if (!resultUpdate) {
      assert(false, `Round ${round + 1} result received`);
      break;
    }
    
    if (round < 2) {
      // Not the last round — advance
      assert(resultUpdate.gameState.status === 'playing', `Round ${round + 1}: game still playing`);
      const nextPromise = waitForEvent(host, 'room_state_update');
      host.emit('game_action', { type: 'next_round' });
      await nextPromise;
    } else {
      // Last round — game should be finished
      assert(resultUpdate.gameState.status === 'finished', 'Game finished after 3 wins');
      assert(resultUpdate.gameState.winnerId === host.id, 'Host (Alice) is the winner');
    }
  }

  host.disconnect();
  guest.disconnect();
  console.log('  ✅ Full game to completion flow complete');
}

// ─── Run all tests ──────────────────────────────────────────
async function main() {
  console.log('🧪 MULTIPLAYER INTEGRATION TESTS');
  console.log('═'.repeat(50));
  console.log(`Connecting to ${SERVER}...\n`);

  try {
    await testSoloTicTacToe();
    await testMultiplayerTicTacToe();
    await testMultiplayerRPS();
    await testSoloRPS();
    await testRoomManagement();
    await testErrorHandling();
    await testBackToLobby();
    await testFullGameToCompletion();
  } catch (err: any) {
    console.log(`\n❌ TEST CRASHED: ${err.message}`);
    failed++;
  }

  console.log('\n' + '═'.repeat(50));
  console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  if (failed > 0) {
    console.log('⚠️  Some tests failed!');
    process.exit(1);
  } else {
    console.log('🎉 All integration tests passed!');
    process.exit(0);
  }
}

main();
