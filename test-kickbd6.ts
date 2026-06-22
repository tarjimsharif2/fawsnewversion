import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function main() {
    try {
        const res = await axios.get('https://kickbd.com', { timeout: 10000 });
        fs.writeFileSync('kickbd-home.html', res.data);
        console.log("Saved to kickbd-home.html. Analyzing with regex...");
        
        // Find blocks that look like teams
        const stringsOfInterest = [];
        const $ = cheerio.load(res.data);
        
        $('a[href*="/matches/"]').each((i, el) => {
            stringsOfInterest.push(`URL: ${$(el).attr('href')}, Text: ${$(el).text().replace(/\s+/g, ' ').trim()}`);
        });

        console.log("Match links:", stringsOfInterest);
    } catch (err: any) {
        console.log("Error:", err.message);
    }
}

main();
