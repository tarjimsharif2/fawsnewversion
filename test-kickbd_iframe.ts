import axios from 'axios';
import * as cheerio from 'cheerio';

async function main() {
    try {
        const res = await axios.get('https://kickbd.com/source/fox_fifa', { timeout: 10000 });
        const $ = cheerio.load(res.data);
        console.log("HTML:", res.data);
    } catch (err: any) {
        console.log("Error:", err.message);
    }
}
main();
