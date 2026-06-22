import { runScraper } from './_scraper.js';

export default async function handler(req: any, res: any) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    await runScraper();
    res.json({ success: true, message: "Scraping completed manually" });
}
