import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function main() {
    try {
        const res = await axios.get('https://kickbd.com/matches/fifa-world-cup-match', { timeout: 10000 });
        fs.writeFileSync('kickbd-match.html', res.data);
        console.log("Saved to kickbd-match.html");
        
        let found = false;
        const $ = cheerio.load(res.data);
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('watch')) {
                console.log("Watch link:", href, $(el).text().trim());
                found = true;
            }
        });
        
        if (!found) {
            console.log("No watch links found. Searching for iframes or streaming scripts...");
            $('iframe').each((i, el) => {
                console.log("Iframe:", $(el).attr('src'));
            });
            $('script').each((i, el) => {
                const text = $(el).text();
                if (text.includes('m3u8') || text.includes('player') || text.includes('jwplayer')) {
                    console.log("Script with player/m3u8 found!");
                }
            });
        }
    } catch (err: any) {
        console.log("Error:", err.message);
    }
}

main();
