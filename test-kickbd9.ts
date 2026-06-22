import axios from 'axios';
import * as cheerio from 'cheerio';

async function main() {
    try {
        const res = await axios.get('https://kickbd.com', { timeout: 10000 });
        const $ = cheerio.load(res.data);
        
        const matches: any[] = [];
        $('a[href*="/matches/"]').each((i, el) => {
            const href = $(el).attr('href') || '';
            if (href.includes('/upcoming')) return;

            const text = $(el).text().replace(/\s+/g, ' ').trim();
            // Try to extract parts
            // "🏆 Argentina VS Algeria 📺 Wed, 17 Jun 07:00 AM Argentina Algeria Starts in ⏳ ..."
            console.log("Found:", href, text);
        });

    } catch (err: any) {
        console.log("Error:", err.message);
    }
}

main();
