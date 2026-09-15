import { chromium } from 'playwright';

const URL = 'http://localhost:5173';

async function runTest() {
  console.log('Starting Draw & Guess E2E Test...');
  
  const browser = await chromium.launch({ headless: true });
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  page1.on('console', msg => console.log('PAGE 1 CONSOLE:', msg.text()));
  page2.on('console', msg => console.log('PAGE 2 CONSOLE:', msg.text()));
  page1.on('pageerror', error => console.error('PAGE 1 ERROR:', error));
  page2.on('pageerror', error => console.error('PAGE 2 ERROR:', error));

  try {
    // ---- Page 1: Create Room ----
    console.log('Page 1: Navigating to Home');
    await page1.goto(URL);
    
    console.log('Page 1: Clicking Multiplayer on Draw & Guess');
    const card = page1.locator('.group', { has: page1.locator('h3:has-text("Draw & Guess")') });
    await card.locator('a:has-text("Multiplayer")').click();
    
    console.log('Page 1: Entering Nickname');
    await page1.fill('input[id="nickname"]', 'Drawer1');
    await page1.click('button:has-text("Create & Join")');
    
    await page1.waitForSelector('.font-mono');
    const roomCode = await page1.locator('.font-mono').first().innerText();
    console.log(`Page 1: Created Room with ID: ${roomCode}`);

    // ---- Page 2: Join Room ----
    console.log('Page 2: Navigating to Home');
    await page2.goto(URL);
    console.log('Page 2: Clicking Join Room');
    await page2.click('a:has-text("Join Room")');
    
    console.log('Page 2: Entering Room Code and Nickname');
    await page2.fill('input[id="roomId"]', roomCode);
    await page2.fill('input[id="nickname"]', 'Guesser2');
    await page2.click('button:has-text("Join Room")');
    
    await page2.waitForSelector('button:has-text("Ready Up")');
    console.log('Page 2: Joined Room successfully');

    // ---- Both: Ready Up ----
    console.log('Both: Readying up');
    await page1.click('button:has-text("Ready")');
    await page2.click('button:has-text("Ready")');
    
    console.log('Page 1: Starting Game');
    await page1.click('button:has-text("Start Game")');
    
    await page1.waitForSelector('text=Get Ready!');
    console.log('Game Starting (Countdown)...');
    
    // Wait for round to start
    await page1.waitForSelector('text=Round 1 of 2', { timeout: 10000 });
    // Wait until playing phase starts (timer will be < 60)
    await page1.waitForFunction(() => {
        const h2 = document.querySelector('h2');
        return h2 && (h2.textContent.includes('You are drawing!') || h2.textContent.includes('is drawing!'));
    }, { timeout: 10000 });
    console.log('Round 1 Started!');

    // Identify who is drawing
    const p1Text = await page1.locator('h2').innerText();
    let drawerPage, guesserPage;
    let drawerName, guesserName;

    if (p1Text.includes('You are drawing!')) {
      drawerPage = page1; guesserPage = page2;
      drawerName = 'Drawer1'; guesserName = 'Guesser2';
    } else {
      drawerPage = page2; guesserPage = page1;
      drawerName = 'Guesser2'; guesserName = 'Drawer1';
    }
    
    console.log(`${drawerName} is the Drawer. ${guesserName} is the Guesser.`);

    // Check Secret Word Security
    const drawerWordText = await drawerPage.locator('div:has-text("Word:")').last().innerText();
    const secretWord = drawerWordText.replace('Word: ', '').trim();
    console.log(`Drawer sees secret word: ${secretWord}`);

    const guesserWordText = await guesserPage.locator('div:has-text("Word:")').last().innerText();
    if (guesserWordText.includes(secretWord) && secretWord.length > 0) {
       throw new Error("SECURITY BREACH: Guesser can see the secret word!");
    } else {
       console.log(`Guesser safely sees: ${guesserWordText.trim()}`);
    }

    // Drawing test
    console.log('Drawer is drawing a stroke...');
    const canvas = drawerPage.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found!");
    
    await drawerPage.mouse.move(box.x + 50, box.y + 50);
    await drawerPage.mouse.down();
    await drawerPage.mouse.move(box.x + 100, box.y + 100, { steps: 5 });
    await drawerPage.mouse.up();
    
    await guesserPage.waitForTimeout(500); // Allow stroke to sync

    // Guessing test
    console.log('Guesser submits wrong guess...');
    await guesserPage.fill('input[placeholder="Type guess..."]', 'thisiswrong');
    await guesserPage.click('button:has-text("Send")');

    console.log('Waiting for thisiswrong...');
    try {
        await guesserPage.waitForSelector('text=thisiswrong', { timeout: 5000 });
        console.log('Found thisiswrong');
    } catch (e) {
        console.log('Timeout waiting for thisiswrong. HTML is:');
        const html = await guesserPage.content();
        console.log(html.substring(0, 1500) + '... (truncated)');
        
        // Print all text in the Guesses container
        const guessesText = await guesserPage.locator('h3:has-text("Guesses") + div').innerText().catch(() => 'no guesses div');
        console.log('Guesses text inside container:', guessesText);
        throw e;
    }
    console.log('Wrong guess displayed correctly.');

    console.log(`Guesser submits correct guess: ${secretWord}`);
    await guesserPage.fill('input[placeholder="Type guess..."]', secretWord);
    await guesserPage.click('button:has-text("Send")');

    await guesserPage.waitForSelector('text=Guessed the word!');
    console.log('Correct guess detected!');

    // Check Result Phase
    console.log('Waiting for Round Over...');
    await drawerPage.waitForSelector('text=Round Over!', { timeout: 15000 });
    console.log('Round 1 Over!');

    // Wait for Round 2
    console.log('Waiting for Round 2...');
    await drawerPage.waitForSelector('text=Round 2 of 2', { timeout: 15000 });
    
    await drawerPage.waitForFunction(() => {
        const h2 = document.querySelector('h2');
        return h2 && (h2.textContent.includes('You are drawing!') || h2.textContent.includes('is drawing!'));
    }, { timeout: 10000 });
    
    console.log('Round 2 Started! Roles should be swapped.');
    const newP1Text = await page1.locator('h2').innerText();
    if (p1Text === newP1Text) {
        throw new Error("Drawer rotation failed! Same player is drawing twice.");
    }
    
    console.log('Test completed successfully! Roles swapped correctly and full loop executed.');

  } catch (error) {
    console.error('Test failed:', error);
    await page1.screenshot({ path: 'draw-guess-error-page1.png' });
    await page2.screenshot({ path: 'draw-guess-error-page2.png' });
    throw error;
  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);
