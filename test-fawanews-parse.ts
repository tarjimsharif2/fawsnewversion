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
        
        $('.user-item').each((i, el) => {
            const anchor = $(el).find('a').first();
            const hrefRaw = anchor.attr('href');
            if(!hrefRaw) return;
            const href = hrefRaw.startsWith('http') ? hrefRaw : `http://www.fawanews.sc/${hrefRaw}`;
            const name = $(el).find('.user-item__name').text().trim();
            const playing = $(el).find('.user-item__playing').text().trim();
            const img = $(el).find('img').attr('src');
            
            if (name && playing && href.includes('.html')) {
                let time = '';
                const timeMatch = playing.match(/\d{2}:\d{2}/);
                if (timeMatch) time = timeMatch[0];
                
                let teams = [name];
                if (name.includes(' vs ')) {
                    teams = name.split(' vs ');
                } else if (name.includes(' - ')) {
                    teams = name.split(' - ');
                }
                
                const matchObj = {
                    title: name,
                    slug: hrefRaw.replace('.html', ''),
                    status: 'Upcoming', // Or deduce
                    time: time,
                    league: playing.replace(time, '').trim(),
                    homeTeam: teams[0] || 'TBD',
                    awayTeam: teams[1] || 'TBD',
                    homeLogo: img || '',
                    awayLogo: img || '',
                    href: href
                };
                matches.push(matchObj);
                console.log(matchObj);
            }
        });
        
        console.log(`Found ${matches.length} matches.`);
    } catch(e) {
        console.error(e);
    }
}
testFetch();
