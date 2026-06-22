import axios from 'axios';
import * as cheerio from 'cheerio';

async function main() {
    try {
        const res = await axios.get('https://kickbd.com', { timeout: 10000 });
        const $ = cheerio.load(res.data);
        
        // Find any scripts
        const scripts = [];
        $('script').each((i, el) => {
            const src = $(el).attr('src');
            if (src) scripts.push(src);
        });
        console.log("Scripts:", scripts);
        
        // Find match links or match data?
        console.log("Body length:", res.data.length);
        
        // See if there's any state seeded in script tags
        let foundState = false;
        $('script:not([src])').each((i, el) => {
            const text = $(el).text();
            if (text.includes('api') || text.includes('fetch') || text.includes('axios')) {
                console.log("Found api/fetch in inline script:");
                console.log(text.substring(0, 200));
            }
        });

        // Let's just grab the whole page text searching for api
        const matchesApi = res.data.match(/https?:\/\/[^\s"'<>\\]+/g);
        if (matchesApi) {
            const uniqueUrls = [...new Set(matchesApi)];
            console.log("URLs found in page:");
            console.log(uniqueUrls.filter(u => `${u}`.includes('api') || `${u}`.includes('backend') || `${u}`.includes('foot') || `${u}`.includes('kick')));
        }
    } catch (err: any) {
        console.log("Error:", err.message);
    }
}

main();
