import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function main() {
    try {
        const res = await axios.get('https://kickbd.com/matches/iframe/fifa-world-cup-match', { timeout: 10000 });
        fs.writeFileSync('kickbd-iframe.html', res.data);
        console.log("Saved to kickbd-iframe.html");
        
        const $ = cheerio.load(res.data);
        // Find links
        $('a').each((i, el) => {
            console.log("A Link:", $(el).attr('href'), $(el).text().trim());
        });
        
        $('script').each((i, el) => {
            const text = $(el).text();
            if (text.includes('m3u8') || text.includes('jwplayer') || text.includes('source')) {
                console.log("Found stream source in script:");
                console.log(text.substring(0, 300));
            }
        });
        
        // Let's print the whole body since it might be small.
        console.log("Body length:", res.data.length);

        const servers: any[] = [];
        $('.server-link').each((i, el) => {
             servers.push($(el).attr('href'));
        });
        if (servers.length === 0) {
             console.log("No .server-link found. Inspecting body...");
             console.log(res.data);
        } else {
             console.log("Servers:", servers);
        }
    } catch (err: any) {
        console.log("Error:", err.message);
    }
}

main();
