import axios from 'axios';
import * as cheerio from 'cheerio';

async function main() {
    try {
        const homeRes = await axios.get('https://kickbd.com', { timeout: 10000 });
        const $ = cheerio.load(homeRes.data);
        
        const matches: any[] = [];
        
        $('a[href*="/matches/"]').each((i, el) => {
            const href = $(el).attr('href') || '';
            if (href.includes('/upcoming')) return;
            const slug = href.split('/').pop() || '';
            const text = $(el).text().replace(/\s+/g, ' ').trim();
            matches.push({ slug, text });
        });

        // Test the first match
        if (matches.length > 0) {
            const m = matches[0];
            const iframeUrl = `https://kickbd.com/matches/iframe/${m.slug}`;
            const iframeRes = await axios.get(iframeUrl);
            const matchTvChannels = iframeRes.data.match(/const tvChannels\s*=\s*(\{.*?\});/s);
            
            let servers: any[] = [];
            if (matchTvChannels) {
                const tvChannels = JSON.parse(matchTvChannels[1]);
                Object.entries(tvChannels).forEach(([channelName, srvs]: [string, any]) => {
                    Object.entries(srvs).forEach(([srvName, srv]: [string, any]) => {
                        servers.push({
                            id: `${m.slug}-${channelName}-${srvName}`.replace(/[^a-zA-Z0-9]/g, '-'),
                            name: `${channelName} - ${srvName}`,
                            url: srv.url, // Might be m3u8 or iframe
                            streamUrl: srv.type === 'm3u8' ? srv.url : '', // Need to resolve further if it's an iframe
                            type: srv.type
                        });
                    });
                });
            }
            
            console.log("Extracted match:", { slug: m.slug, text: m.text, servers });
        }
    } catch (err: any) {
        console.log("Error:", err.message);
    }
}
main();
