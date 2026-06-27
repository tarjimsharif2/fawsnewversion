import { runScraper, getCachedMatches } from './api/_scraper';

async function test() {
    await runScraper();
    const data = getCachedMatches();
    console.log(JSON.stringify(data.matches.slice(0, 2), null, 2));
}
test();
