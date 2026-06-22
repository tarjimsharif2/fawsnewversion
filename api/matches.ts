import { runScraper, getCachedMatches, needsRefresh } from './_scraper.js';

export default async function handler(req: any, res: any) {
    // Vercel Edge CDN Caching Strategy:
    // - Serve from Edge Cache for 60 seconds (s-maxage=60)
    // - If data is stale (61-90 seconds), serve cached data instantly and refresh scraper in the background (stale-while-revalidate=30)
    // - Allow browser cache of 15 seconds to prevent spammy repeated triggers.
    // This reduces Vercel Function usage by 99% and shields the external API from heavy traffic.
    res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=60, stale-while-revalidate=30');

    try {
        if (needsRefresh()) {
            await runScraper();
        }
        
        const cached = getCachedMatches();
        return res.json(cached);
    } catch (err: any) {
        console.error("Vercel route handler error:", err);
        return res.status(200).json({
            lastScraped: null,
            matches: [],
            error: `API Route Handler Crash: ${err.message || err} ${err.stack ? `\nStack: ${err.stack}` : ''}`
        });
    }
}
