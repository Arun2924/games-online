import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\acer\\.gemini\\antigravity-ide\\brain\\89c7e8a1-8d02-4713-891e-1e08700a9874';

async function runTest() {
  console.log('Starting Homepage E2E Test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Navigating to Home');
    await page.goto('http://localhost:5173');
    
    // Wait for Game Collection to load
    await page.waitForSelector('h2:has-text("Game Collection")');
    
    // Check initial game count (should show all games, e.g. Tic Tac Toe)
    const initialGames = await page.locator('.grid > div').count();
    console.log(`Initial games displayed: ${initialGames}`);
    if (initialGames < 3) throw new Error('Expected at least 3 games initially');

    // Test Search
    console.log('Testing search for "Tic Tac"');
    await page.fill('input[placeholder="Search games..."]', 'Tic Tac');
    
    // Wait for the DOM to update
    await page.waitForTimeout(500);
    const searchGames = await page.locator('.grid > div').count();
    console.log(`Games displayed after search: ${searchGames}`);
    if (searchGames !== 1) throw new Error('Expected exactly 1 game after searching "Tic Tac"');

    // Clear search
    await page.fill('input[placeholder="Search games..."]', '');
    await page.waitForTimeout(500);

    // Test Category Filter
    console.log('Testing category filter for "Quiz"');
    await page.click('button:has-text("Quiz")');
    
    await page.waitForTimeout(500);
    const quizGames = await page.locator('.grid > div').count();
    console.log(`Games displayed after filtering: ${quizGames}`);
    if (quizGames === 0) throw new Error('Expected at least 1 quiz game');
    
    // Screenshot
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'homepage-test.png') });
    
    console.log('Test completed successfully!');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();
