import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\acer\\.gemini\\antigravity-ide\\brain\\89c7e8a1-8d02-4713-891e-1e08700a9874';

async function runTest() {
  console.log('Starting Browser Multiplayer Test...');
  const browser = await chromium.launch({ headless: true });
  
  // Create two separate browser contexts
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  try {
    // ---- HOST FLOW ----
    console.log('Page 1: Navigating to Home');
    await page1.goto('http://localhost:5173');
    
    // Click "Multiplayer" for Tic Tac Toe
    // It's the 2nd link in the Tic Tac Toe card (first is vs Bot)
    console.log('Page 1: Clicking Multiplayer on Tic Tac Toe');
    // Find the Tic Tac Toe card specifically
    const ticTacToeCard = page1.locator('h3:has-text("Tic Tac Toe")').locator('..');
    await ticTacToeCard.locator('text="Multiplayer"').click();
    
    console.log('Page 1: Entering Nickname');
    await page1.waitForSelector('input#nickname');
    await page1.fill('input#nickname', 'HostPlayer');
    await page1.click('button:has-text("Create & Join")');
    
    // Wait to enter lobby
    await page1.waitForSelector('h1:has-text("Room")');
    
    // Extract Room ID
    const headingText = await page1.textContent('h1');
    const roomId = headingText?.replace('Room', '').trim() || '';
    console.log(`Page 1: Created Room with ID: ${roomId}`);
    
    await page1.screenshot({ path: path.join(ARTIFACT_DIR, 'multiplayer_1_host_lobby.png') });
    
    // ---- GUEST FLOW ----
    console.log('Page 2: Navigating to Home');
    await page2.goto('http://localhost:5173');
    
    console.log('Page 2: Clicking Join Room');
    await page2.click('text="Join Room"');
    
    console.log('Page 2: Entering Room Code and Nickname');
    await page2.fill('input#roomId', roomId);
    await page2.fill('input#nickname', 'GuestPlayer');
    await page2.click('button:has-text("Join Room")');
    
    await page2.waitForSelector('text="Players (2/2)"');
    console.log('Page 2: Joined Room successfully');
    
    await page2.screenshot({ path: path.join(ARTIFACT_DIR, 'multiplayer_2_guest_lobby.png') });
    
    // ---- READY UP & START ----
    console.log('Both: Readying up');
    await page2.click('button:has-text("Ready Up")');
    await page1.click('button:has-text("Ready Up")');
    
    // Wait for Start Game button to be enabled for host
    console.log('Page 1: Starting Game');
    const startButton = page1.locator('button:has-text("Start Game")');
    await startButton.waitFor({ state: 'visible' });
    await startButton.click();
    
    // Wait for game board
    await page1.waitForSelector('text=/Your Turn/');
    console.log('Game Started!');
    
    // ---- PLAY MOVES ----
    // Host plays center (index 4)
    console.log('Page 1: Playing center');
    // Find the 5th button (index 4)
    await page1.click('div.grid > button:nth-child(5)');
    
    // Wait for Guest's turn
    await page2.waitForSelector('text=/Your Turn/');
    console.log('Page 2: Playing top-left');
    // Guest plays top-left (index 0)
    await page2.click('div.grid > button:nth-child(1)');
    
    // Wait for Host's turn again
    await page1.waitForSelector('text=/Your Turn/');
    
    // Take final screenshots of the boards
    console.log('Taking final screenshots of the boards');
    await page1.screenshot({ path: path.join(ARTIFACT_DIR, 'multiplayer_3_host_board.png') });
    await page2.screenshot({ path: path.join(ARTIFACT_DIR, 'multiplayer_4_guest_board.png') });
    
    console.log('Test completed successfully!');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
  }
}

runTest();
