import assert from 'node:assert';
import { gamesRegistry } from '../shared/dist/index.js';

function runRegistryTests() {
  console.log('Running Game Registry Tests...');
  let passed = 0;
  let failed = 0;

  const test = (name, fn) => {
    try {
      fn();
      passed++;
      console.log(`✅ ${name}`);
    } catch (e) {
      failed++;
      console.error(`❌ ${name}`);
      console.error(e.message);
    }
  };

  test('Registry loads and is not empty', () => {
    assert(Array.isArray(gamesRegistry), 'gamesRegistry should be an array');
    assert(gamesRegistry.length > 0, 'gamesRegistry should not be empty');
  });

  test('Game IDs are unique', () => {
    const ids = new Set();
    for (const game of gamesRegistry) {
      assert(!ids.has(game.id), `Duplicate game ID found: ${game.id}`);
      ids.add(game.id);
    }
  });

  test('Required metadata exists', () => {
    for (const game of gamesRegistry) {
      assert(game.id, 'Missing id');
      assert(game.name, `Missing name for ${game.id}`);
      assert(game.category, `Missing category for ${game.id}`);
      assert(game.icon, `Missing icon for ${game.id}`);
      assert(game.estimatedDuration, `Missing duration for ${game.id}`);
      assert(Array.isArray(game.supportedModes), `Missing supportedModes for ${game.id}`);
    }
  });

  test('Player limits are valid', () => {
    for (const game of gamesRegistry) {
      assert(typeof game.minPlayers === 'number', `minPlayers must be a number in ${game.id}`);
      assert(typeof game.maxPlayers === 'number', `maxPlayers must be a number in ${game.id}`);
      assert(game.minPlayers > 0, `minPlayers must be > 0 in ${game.id}`);
      assert(game.maxPlayers >= game.minPlayers, `maxPlayers must be >= minPlayers in ${game.id}`);
      assert(game.maxPlayers <= 6, `maxPlayers should ideally be <= 6 (currently ${game.maxPlayers}) in ${game.id}`);
    }
  });

  test('Categories are valid', () => {
    const validCategories = [
      'Quiz', 'Board', 'Card', '2D Action', 'Racing', 'Arcade', 
      'Fighting', 'Puzzle', 'Party', 'Competitive', 'Reaction / Skill', 'Drawing / Creativity'
    ];
    for (const game of gamesRegistry) {
      assert(validCategories.includes(game.category), `Invalid category "${game.category}" in ${game.id}`);
    }
  });

  console.log(`\nRegistry Tests Completed: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runRegistryTests();
