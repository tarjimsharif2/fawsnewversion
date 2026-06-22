import { runScraper, getCachedMatches } from './api/_scraper.js';

async function main() {
    console.log("Running scraper...");
    await runScraper();
    const data = getCachedMatches();
    console.log(`Scraped ${data.matches.length} matches!`);
    if (data.matches.length > 0) {
        const m = data.matches[0];
        console.log("First match servers count:", m.servers.length);
        console.log("First match names:", m.homeTeam, "vs", m.awayTeam);
        console.log("First server:", m.servers[0]);
    }
}
main();
