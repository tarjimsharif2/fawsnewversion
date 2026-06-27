import { runScraper, getCachedMatches } from './api/_scraper';
async function test() {
    await runScraper();
    const data = getCachedMatches();
    console.log(JSON.stringify(data.matches.find(m => m.servers?.some(s => s.url?.includes('fawanews'))), null, 2));
}
test();
