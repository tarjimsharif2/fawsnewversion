import puppeteer from 'puppeteer';

async function run() {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('http://www.fawanews.sc/FIFA_world_cup_2026_Cape_Verde_vs_Saudi_Arabia_hd1.html');
    await page.screenshot({ path: 'screenshot.png' });
    console.log("Screenshot saved.");
    await browser.close();
}
run();
