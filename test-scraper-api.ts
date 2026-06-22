import { runScraper, getCachedMatches } from './api/_scraper';

async function test() {
    console.log("Running scraper...");
    await runScraper();
    const data = getCachedMatches();
    console.log(`Found ${data.matches?.length || 0} matches`);
    if(data.matches?.length > 0) {
        console.log("First match servers:", data.matches[0].servers);
    }
}
test();
