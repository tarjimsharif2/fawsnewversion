import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function testFetch() {
    try {
        console.log("Fetching fawanews match");
        const res = await axios.get('http://www.fawanews.sc/Kinondoni MC vs Coastal Union.html', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            timeout: 10000,
            validateStatus: () => true
        });
        fs.writeFileSync('fawanews-match.html', res.data);
        console.log("Saved to fawanews-match.html");
    } catch(e) {
        console.error(e);
    }
}
testFetch();
