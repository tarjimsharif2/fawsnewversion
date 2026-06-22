import axios from 'axios';
import * as cheerio from 'cheerio';

async function testFetch() {
    try {
        console.log("Fetching fawanews");
        const res = await axios.get('http://www.fawanews.sc/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            timeout: 10000,
            validateStatus: () => true
        });
        console.log(`Status: ${res.status}`);
        
        const html = res.data;
        const $ = cheerio.load(html);
        
        const matches: any[] = [];
        
        $('a.slim-fixture-card').each((i, el) => {
            const href = $(el).attr('href') || $(el).attr('data-link') || '#';
            const teams: string[] = [];
            const logos: string[] = [];
            
            $(el).find('img').each((j, img) => {
                const alt = $(img).attr('alt') || '';
                if (alt) teams.push(alt.trim());
                const src = $(img).attr('src');
                if (src) logos.push(src.startsWith('http') ? src : `http://www.fawanews.sc${src}`);
            });
            
            $(el).find('span.fixture-team-name').each((j, span) => {
                 if (teams.length < 2) {
                     teams.push($(span).text().trim());
                 }
            });
            
            console.log("Found match href:", href);
            matches.push({href, teams});
        });
        
        console.log(`Found ${matches.length} matches.`);
    } catch(e) {
        console.error(e);
    }
}
testFetch();
