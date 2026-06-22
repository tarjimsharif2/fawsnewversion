import axios from 'axios';
import * as cheerio from 'cheerio';

async function testFetch() {
    try {
        console.log("Fetching fawanews match");
        const res = await axios.get('http://www.fawanews.sc/Snooker China Open --- Table 4.html', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            timeout: 10000,
            validateStatus: () => true
        });
        
        const html = res.data;
        const videoMatch = html.match(/var\s+videos\s*=\s*(\[.*?\])/s);
        if (videoMatch) {
            console.log("found videos:", videoMatch[1]);
        }
    } catch(e) {
        console.error(e);
    }
}
testFetch();
