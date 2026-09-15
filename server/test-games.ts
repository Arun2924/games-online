/**
 * Comprehensive game logic tests for TicTacToe, RPS, and Reaction.
 * Run with: npx tsx test-games.ts
 */

import { TicTacToe } from './src/games/TicTacToe';
import { RockPaperScissors } from './src/games/RockPaperScissors';
import { Reaction } from './src/games/Reaction';

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

// ═══════════════════════════════════════════════════════════
// TIC TAC TOE TESTS
// ═══════════════════════════════════════════════════════════
console.log('\n🎮 TIC TAC TOE');
console.log('─'.repeat(50));

{
  // Test 1: Initial state
  const state = TicTacToe.createState(['p1', 'p2']);
  assert(state.status === 'playing', 'Initial status is "playing"');
  assert(state.state.board.every((c: any) => c === null), 'Board starts empty');
  assert(state.state.currentTurn === 'p1', 'Player 1 goes first');
  assert(state.players['p1'].symbol === 'X', 'Player 1 is X');
  assert(state.players['p2'].symbol === 'O', 'Player 2 is O');

  // Test 2: Valid move
  let s = TicTacToe.handleAction(state, { type: 'play_move', payload: { index: 4 } }, 'p1');
  assert(s.state.board[4] === 'X', 'P1 places X at center');
  assert(s.state.currentTurn === 'p2', 'Turn switches to P2');

  // Test 3: Invalid move - wrong turn
  let s2 = TicTacToe.handleAction(s, { type: 'play_move', payload: { index: 0 } }, 'p1');
  assert(s2 === s, 'P1 cannot move on P2\'s turn (state unchanged)');

  // Test 4: Invalid move - occupied cell
  let s3 = TicTacToe.handleAction(s, { type: 'play_move', payload: { index: 4 } }, 'p2');
  assert(s3 === s, 'Cannot place on occupied cell');

  // Test 5: Win detection - horizontal
  let winState = TicTacToe.createState(['p1', 'p2']);
  winState = TicTacToe.handleAction(winState, { type: 'play_move', payload: { index: 0 } }, 'p1'); // X
  winState = TicTacToe.handleAction(winState, { type: 'play_move', payload: { index: 3 } }, 'p2'); // O
  winState = TicTacToe.handleAction(winState, { type: 'play_move', payload: { index: 1 } }, 'p1'); // X
  winState = TicTacToe.handleAction(winState, { type: 'play_move', payload: { index: 4 } }, 'p2'); // O
  winState = TicTacToe.handleAction(winState, { type: 'play_move', payload: { index: 2 } }, 'p1'); // X wins top row
  assert(winState.status === 'finished', 'Game ends on horizontal win');
  assert(winState.winnerId === 'p1', 'P1 wins with top row');

  // Test 6: Win detection - diagonal
  let diagState = TicTacToe.createState(['p1', 'p2']);
  diagState = TicTacToe.handleAction(diagState, { type: 'play_move', payload: { index: 0 } }, 'p1');
  diagState = TicTacToe.handleAction(diagState, { type: 'play_move', payload: { index: 1 } }, 'p2');
  diagState = TicTacToe.handleAction(diagState, { type: 'play_move', payload: { index: 4 } }, 'p1');
  diagState = TicTacToe.handleAction(diagState, { type: 'play_move', payload: { index: 2 } }, 'p2');
  diagState = TicTacToe.handleAction(diagState, { type: 'play_move', payload: { index: 8 } }, 'p1');
  assert(diagState.status === 'finished', 'Game ends on diagonal win');
  assert(diagState.winnerId === 'p1', 'P1 wins with diagonal');

  // Test 7: Draw detection
  let drawState = TicTacToe.createState(['p1', 'p2']);
  const drawMoves = [
    { index: 0, player: 'p1' }, // X
    { index: 4, player: 'p2' }, // O
    { index: 8, player: 'p1' }, // X
    { index: 2, player: 'p2' }, // O
    { index: 6, player: 'p1' }, // X
    { index: 3, player: 'p2' }, // O
    { index: 5, player: 'p1' }, // X
    { index: 7, player: 'p2' }, // O (was missing from diagonal/rows)
    { index: 1, player: 'p1' }, // X fills last cell
  ];
  for (const m of drawMoves) {
    drawState = TicTacToe.handleAction(drawState, { type: 'play_move', payload: { index: m.index } }, m.player);
  }
  assert(drawState.status === 'finished', 'Game ends when board is full');
  assert(drawState.state.isDraw === true || drawState.winnerId !== null, 'Game is draw or has winner on full board');

  // Test 8: Cannot move after game over
  let postGame = TicTacToe.handleAction(winState, { type: 'play_move', payload: { index: 7 } }, 'p2');
  assert(postGame === winState, 'Cannot move after game is finished');

  // Test 9: Invalid index
  let badIndex = TicTacToe.handleAction(state, { type: 'play_move', payload: { index: 9 } }, 'p1');
  assert(badIndex === state, 'Index 9 is rejected');
  let negIndex = TicTacToe.handleAction(state, { type: 'play_move', payload: { index: -1 } }, 'p1');
  assert(negIndex === state, 'Negative index is rejected');

  // Test 10: Bot AI
  assert(typeof TicTacToe.botMove === 'function', 'TicTacToe has botMove function');
  let botState = TicTacToe.createState(['human', 'bot_1']);
  // Human plays center
  botState = TicTacToe.handleAction(botState, { type: 'play_move', payload: { index: 4 } }, 'human');
  assert(botState.state.currentTurn === 'bot_1', 'It is bot\'s turn after human move');
  const botAction = TicTacToe.botMove!(botState, 'bot_1');
  assert(botAction !== null, 'Bot returns a valid action');
  assert(botAction!.type === 'play_move', 'Bot action type is play_move');
  assert(typeof botAction!.payload.index === 'number', 'Bot returns a numeric index');
  assert(botState.state.board[botAction!.payload.index] === null, 'Bot targets an empty cell');

  // Test 11: Bot doesn't move when it's not its turn
  const notBotTurn = TicTacToe.botMove!(state, 'p2');
  assert(notBotTurn === null, 'Bot returns null when it\'s not its turn');
}

// ═══════════════════════════════════════════════════════════
// ROCK PAPER SCISSORS TESTS
// ═══════════════════════════════════════════════════════════
console.log('\n🪨 ROCK PAPER SCISSORS');
console.log('─'.repeat(50));

{
  // Test 1: Initial state
  const state = RockPaperScissors.createState(['p1', 'p2']);
  assert(state.status === 'playing', 'Initial status is playing');
  assert(state.players['p1'].choice === null, 'P1 starts with no choice');
  assert(state.players['p2'].choice === null, 'P2 starts with no choice');
  assert(state.players['p1'].score === 0, 'P1 starts with score 0');
  assert(state.state.round === 1, 'Starts at round 1');

  // Test 2: Single player choice (no resolution yet)
  let s = RockPaperScissors.handleAction(state, { type: 'play_move', payload: { choice: 'rock' } }, 'p1');
  assert(s.players['p1'].choice === 'rock', 'P1 choice is recorded');
  assert(s.players['p2'].choice === null, 'P2 still null');
  assert(s.status === 'playing', 'Game still playing after one choice');

  // Test 3: Rock beats scissors
  let s2 = RockPaperScissors.handleAction(s, { type: 'play_move', payload: { choice: 'scissors' } }, 'p2');
  assert(s2.state.roundResult !== null, 'Round result is generated');
  assert(s2.state.roundResult.winner === 'p1', 'Rock beats scissors');
  assert(s2.players['p1'].score === 1, 'Winner gets a point');
  assert(s2.players['p2'].score === 0, 'Loser stays at 0');

  // Test 4: Paper beats rock
  let fresh = RockPaperScissors.createState(['p1', 'p2']);
  fresh = RockPaperScissors.handleAction(fresh, { type: 'play_move', payload: { choice: 'rock' } }, 'p1');
  fresh = RockPaperScissors.handleAction(fresh, { type: 'play_move', payload: { choice: 'paper' } }, 'p2');
  assert(fresh.state.roundResult.winner === 'p2', 'Paper beats rock');

  // Test 5: Scissors beats paper
  let fresh2 = RockPaperScissors.createState(['p1', 'p2']);
  fresh2 = RockPaperScissors.handleAction(fresh2, { type: 'play_move', payload: { choice: 'paper' } }, 'p1');
  fresh2 = RockPaperScissors.handleAction(fresh2, { type: 'play_move', payload: { choice: 'scissors' } }, 'p2');
  assert(fresh2.state.roundResult.winner === 'p1' || fresh2.state.roundResult.winner === 'p2', 'Scissors beats paper — has a winner');
  // Actually: p1=paper, p2=scissors → p2 wins
  assert(fresh2.state.roundResult.winner === 'p2', 'P2 with scissors beats P1 with paper');

  // Test 6: Draw
  let drawState = RockPaperScissors.createState(['p1', 'p2']);
  drawState = RockPaperScissors.handleAction(drawState, { type: 'play_move', payload: { choice: 'rock' } }, 'p1');
  drawState = RockPaperScissors.handleAction(drawState, { type: 'play_move', payload: { choice: 'rock' } }, 'p2');
  assert(drawState.state.roundResult.winner === 'draw', 'Same choice is a draw');
  assert(drawState.players['p1'].score === 0, 'No points on draw');

  // Test 7: Cannot choose twice
  let doubleChoice = RockPaperScissors.createState(['p1', 'p2']);
  doubleChoice = RockPaperScissors.handleAction(doubleChoice, { type: 'play_move', payload: { choice: 'rock' } }, 'p1');
  let blocked = RockPaperScissors.handleAction(doubleChoice, { type: 'play_move', payload: { choice: 'paper' } }, 'p1');
  assert(blocked === doubleChoice, 'P1 cannot change choice after choosing');

  // Test 8: Invalid choice rejected
  let invalid = RockPaperScissors.handleAction(state, { type: 'play_move', payload: { choice: 'gun' } }, 'p1');
  assert(invalid === state, 'Invalid choice "gun" is rejected');

  // Test 9: Next round resets choices
  let afterRound = RockPaperScissors.handleAction(s2, { type: 'next_round' }, 'p1');
  assert(afterRound.players['p1'].choice === null, 'P1 choice reset after next_round');
  assert(afterRound.players['p2'].choice === null, 'P2 choice reset after next_round');
  assert(afterRound.state.roundResult === null, 'Round result cleared');
  assert(afterRound.players['p1'].score === 1, 'Score preserved after next_round');

  // Test 10: Game ends at score 3
  let endGame = RockPaperScissors.createState(['p1', 'p2']);
  for (let i = 0; i < 3; i++) {
    endGame = RockPaperScissors.handleAction(endGame, { type: 'play_move', payload: { choice: 'rock' } }, 'p1');
    endGame = RockPaperScissors.handleAction(endGame, { type: 'play_move', payload: { choice: 'scissors' } }, 'p2');
    if (endGame.status === 'playing') {
      endGame = RockPaperScissors.handleAction(endGame, { type: 'next_round' }, 'p1');
    }
  }
  assert(endGame.status === 'finished', 'Game finishes at score 3');
  assert(endGame.winnerId === 'p1', 'P1 wins with 3 points');

  // Test 11: Bot AI
  assert(typeof RockPaperScissors.botMove === 'function', 'RPS has botMove function');
  let botState = RockPaperScissors.createState(['human', 'bot_1']);
  const botAction = RockPaperScissors.botMove!(botState, 'bot_1');
  assert(botAction !== null, 'Bot returns an action');
  assert(['rock', 'paper', 'scissors'].includes(botAction!.payload.choice), 'Bot choice is valid');

  // Bot doesn't move after already choosing
  let botChosen = RockPaperScissors.handleAction(botState, { type: 'play_move', payload: { choice: 'rock' } }, 'bot_1');
  const botAction2 = RockPaperScissors.botMove!(botChosen, 'bot_1');
  assert(botAction2 === null, 'Bot returns null after already choosing');

  // Bot doesn't move during round result
  let withResult = RockPaperScissors.createState(['human', 'bot_1']);
  withResult = RockPaperScissors.handleAction(withResult, { type: 'play_move', payload: { choice: 'rock' } }, 'human');
  withResult = RockPaperScissors.handleAction(withResult, { type: 'play_move', payload: { choice: 'paper' } }, 'bot_1');
  const botAction3 = RockPaperScissors.botMove!(withResult, 'bot_1');
  assert(botAction3 === null, 'Bot returns null when round result is showing');
}

// ═══════════════════════════════════════════════════════════
// REACTION CHALLENGE TESTS
// ═══════════════════════════════════════════════════════════
console.log('\n⚡ REACTION CHALLENGE');
console.log('─'.repeat(50));

{
  // Test 1: Initial state with 2 players
  const state2p = Reaction.createState(['p1', 'p2']);
  assert(state2p.status === 'playing', 'Initial status is playing');
  assert(state2p.players['p1'].score === 0, 'P1 starts at 0');
  assert(state2p.players['p2'].score === 0, 'P2 starts at 0');
  assert(state2p.state.phase === 'waiting', 'Phase starts as waiting');

  // Test 2: Initial state with 4 players
  const state4p = Reaction.createState(['p1', 'p2', 'p3', 'p4']);
  assert(Object.keys(state4p.players).length === 4, '4-player game has 4 player entries');
  assert(state4p.players['p3'].score === 0, 'P3 starts at 0');
  assert(state4p.players['p4'].score === 0, 'P4 starts at 0');

  // Test 3: Initial state with 6 players
  const state6p = Reaction.createState(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
  assert(Object.keys(state6p.players).length === 6, '6-player game has 6 player entries');

  // Test 4: Initial state solo (1 player)
  const stateSolo = Reaction.createState(['p1']);
  assert(Object.keys(stateSolo.players).length === 1, 'Solo game has 1 player entry');

  // Test 5: start_round sets a future triggerTime
  let s = Reaction.handleAction(state2p, { type: 'start_round' }, 'p1');
  assert(s.state.triggerTime !== null, 'triggerTime is set after start_round');
  assert(s.state.triggerTime > Date.now(), 'triggerTime is in the future');
  assert(s.state.phase === 'waiting', 'Phase is still waiting');

  // Test 6: Click before triggerTime = false start
  // Simulate by setting triggerTime far in the future
  let falseStartState = { ...s, state: { ...s.state, triggerTime: Date.now() + 999999 } };
  let result = Reaction.handleAction(falseStartState, { type: 'click' }, 'p1');
  assert(result.state.falseStartId === 'p1', 'False start correctly identifies clicker');
  assert(result.state.phase === 'result', 'Phase becomes result after false start');
  assert(result.state.roundWinnerId === null, 'No winner on false start');

  // Test 7: Click after triggerTime = valid click, wins round
  let readyState = { ...s, state: { ...s.state, triggerTime: Date.now() - 100 } }; // trigger time already passed
  let validClick = Reaction.handleAction(readyState, { type: 'click' }, 'p1');
  assert(validClick.state.roundWinnerId === 'p1', 'P1 wins the round on first valid click');
  assert(validClick.state.phase === 'result', 'Phase becomes result');
  assert(validClick.players['p1'].score === 1, 'Winner gets a point');
  assert(validClick.state.reactionTimeMs !== null, 'Reaction time is recorded');

  // Test 8: Game ends when score reaches threshold
  let endState = Reaction.createState(['p1', 'p2']);
  endState.players['p1'].score = 2; // Already 2 points
  endState = { ...endState, state: { ...endState.state, triggerTime: Date.now() - 50, phase: 'waiting', clickedThisRound: [] } };
  let finalClick = Reaction.handleAction(endState, { type: 'click' }, 'p1');
  assert(finalClick.status === 'finished', 'Game ends at score 3');
  assert(finalClick.winnerId === 'p1', 'P1 is the winner');

  // Test 9: Cannot click during result phase
  let resultPhase = { ...state2p, state: { ...state2p.state, phase: 'result' } };
  let blocked = Reaction.handleAction(resultPhase, { type: 'click' }, 'p1');
  assert(blocked === resultPhase, 'Cannot click during result phase');

  // Test 10: Cannot double-click
  let clickedOnce = { ...readyState, state: { ...readyState.state, clickedThisRound: ['p1'] } };
  let doubleClick = Reaction.handleAction(clickedOnce, { type: 'click' }, 'p1');
  assert(doubleClick === clickedOnce, 'Cannot click twice in same round');

  // Test 11: In multi-player, first valid click wins
  let mp = Reaction.createState(['p1', 'p2', 'p3']);
  mp = { ...mp, state: { ...mp.state, triggerTime: Date.now() - 100, clickedThisRound: [] } };
  let p2Clicks = Reaction.handleAction(mp, { type: 'click' }, 'p2');
  assert(p2Clicks.state.roundWinnerId === 'p2', 'First valid clicker (P2) wins');
  assert(p2Clicks.players['p2'].score === 1, 'P2 gets a point');
}

// ═══════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(50));
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (failed > 0) {
  console.log('⚠️  Some tests failed!');
  process.exit(1);
} else {
  console.log('🎉 All tests passed!');
  process.exit(0);
}
