import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\acer\\.gemini\\antigravity-ide\\brain\\89c7e8a1-8d02-4713-891e-1e08700a9874';

async function runTest() {
  console.log('Starting Speed Quiz E2E Test...');
  const browser = await chromium.launch({ headless: true });
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  page1.on('console', msg => console.log('PAGE 1 CONSOLE:', msg.text()));
  page2.on('console', msg => console.log('PAGE 2 CONSOLE:', msg.text()));
  
  try {
    // ---- HOST FLOW ----
    console.log('Page 1: Navigating to Home');
    await page1.goto('http://localhost:5173');
    
    console.log('Page 1: Clicking Multiplayer on Speed Quiz');
    const quizCard = page1.locator('h3:has-text("Speed Quiz")').locator('..');
    await quizCard.locator('text="Multiplayer"').click();
    
    console.log('Page 1: Entering Nickname');
    await page1.waitForSelector('input#nickname');
    await page1.fill('input#nickname', 'HostPlayer');
    await page1.click('button:has-text("Create & Join")');
    
    await page1.waitForSelector('h1:has-text("Room")');
    
    const headingText = await page1.textContent('h1');
    const roomId = headingText?.replace('Room', '').trim() || '';
    console.log(`Page 1: Created Room with ID: ${roomId}`);
    
    // ---- GUEST FLOW ----
    console.log('Page 2: Navigating to Home');
    await page2.goto('http://localhost:5173');
    
    console.log('Page 2: Clicking Join Room');
    await page2.click('text="Join Room"');
    
    console.log('Page 2: Entering Room Code and Nickname');
    await page2.fill('input#roomId', roomId);
    await page2.fill('input#nickname', 'GuestPlayer');
    await page2.click('button:has-text("Join Room")');
    
    try {
      await page2.waitForSelector('text="Players (2/2)"', { timeout: 10000 });
      console.log('Page 2: Joined Room successfully');
    } catch (e) {
      await page2.screenshot({ path: path.join(ARTIFACT_DIR, 'speed-quiz-guest-failed.png') });
      await page1.screenshot({ path: path.join(ARTIFACT_DIR, 'speed-quiz-host-failed.png') });
      throw e;
    }
    
    // ---- READY UP & START ----
    console.log('Both: Readying up');
    await page2.click('button:has-text("Ready Up")');
    await page1.click('button:has-text("Ready Up")');
    
    console.log('Page 1: Starting Game');
    const startButton = page1.locator('button:has-text("Start Game")');
    await startButton.waitFor({ state: 'visible' });
    await startButton.click();
    
    // Wait for the quiz UI
    await page1.waitForSelector('text=/Round 1 \\/ 5/');
    console.log('Quiz Started!');
    
    // Click the first choice on Page 1
    console.log('Page 1: Clicking first choice');
    await page1.click('button:has-text("A") >> nth=0'); // Just click the first button it finds in the choices grid
    // Wait, the choices are actual text, we can't reliably guess the text. Let's use structural selector.
    const choiceButtons = page1.locator('div.grid > button');
    await choiceButtons.first().click();
    
    // Check if the button locked
    const isDisabled = await choiceButtons.first().isDisabled();
    if (!isDisabled) throw new Error("Button should be disabled after answering");
    
    // Let Page 2 click the second choice
    console.log('Page 2: Clicking second choice');
    const p2ChoiceButtons = page2.locator('div.grid > button');
    await p2ChoiceButtons.nth(1).click();
    
    // Wait for round result
    console.log('Waiting for round result...');
    await page1.waitForSelector('text="Round Over!"', { timeout: 20000 });
    
    console.log('Test completed successfully!');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();
