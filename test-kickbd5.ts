import axios from 'axios';
import * as cheerio from 'cheerio';

async function main() {
    try {
        const res = await axios.get('https://kickbd.com', { timeout: 10000 });
        const $ = cheerio.load(res.data);
        
        const matches = [];
        $('.match-card').each((i, el) => {
            matches.push($(el).text().trim());
        });
        console.log("Found match-cards:", matches.length);
        
        // Find other potential match lists
        const anyCards = [];
        $('.card').each((i, el) => {
            anyCards.push($(el).text().trim());
        });
        console.log("Found cards:", anyCards.length);

        console.log("HTML Sample:", res.data.substring(0, 1500));
    } catch (err: any) {
        console.log("Error:", err.message);
    }
}

main();
