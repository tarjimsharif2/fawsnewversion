import { getCachedMatches, runScraper, needsRefresh } from './_scraper.js';

const createSlug = (text: string) => {
  return (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const getMatchSlug = (home: string, away: string) => {
   return createSlug(`${home || 'unknown'}-vs-${away || 'unknown'}`);
};

const getServerSlugs = (servers: any[]) => {
   const slugs: Record<string, string> = {};
   const nameCount: Record<string, number> = {};
   servers.forEach(s => {
       const baseSlug = createSlug(s.name) || 'server';
       nameCount[baseSlug] = (nameCount[baseSlug] || 0) + 1;
       if (nameCount[baseSlug] === 1) {
           slugs[s.id] = baseSlug;
       } else {
           slugs[s.id] = `${baseSlug}-${nameCount[baseSlug]}`;
       }
   });
   return slugs;
};

export default async function handler(req: any, res: any) {
    // Vercel Edge caching
    res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=60, stale-while-revalidate=30');

    try {
        if (needsRefresh()) {
            await runScraper();
        }

        const { matches, lastScraped } = getCachedMatches();
        
        const host = req.headers.host || 'tv.photocard.fun';
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const baseUrl = `${protocol}://${host}`;

        const formattedMatches: any[] = [];

        matches.forEach(match => {
            // Only include servers that are marked as working, or if validation hasn't finished, wait? 
            // We'll just include the ones that are working or still validating.
            // Actually, the user asked to ONLY include working links.
            const workingServers = match.servers.filter(s => (s as any).isWorking === true);
            const reactMatchSlug = getMatchSlug(match.homeTeam, match.awayTeam);
            const reactServerSlugs = getServerSlugs(match.servers);

            workingServers.forEach((server, index) => {
                let streamUrl = server.streamUrl || server.url;
                
                const serverId = reactServerSlugs[server.id] || `server-${index + 1}`;
                
                // Add uniqueness to ID if there are multiple servers
                const matchId = index === 0 ? `${reactMatchSlug}.html` : `${reactMatchSlug}_${index}.html`;
                const suffix = match.servers.length > 1 ? ` --- S${index + 1}` : '';

                const teamA = match.homeTeam && match.homeTeam !== 'Team A' ? match.homeTeam : '';
                const teamB = match.awayTeam && match.awayTeam !== 'Team B' ? match.awayTeam : '';
                let formattedName = match.title;
                if (teamA && teamB) {
                    formattedName = `${teamA} vs ${teamB}`;
                }

                formattedMatches.push({
                    id: matchId,
                    name: `${formattedName}${suffix}`,
                    league: match.competition || "Live Sports",
                    time: match.time ? new Date(match.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "TBA",
                    image: match.homeLogo || "https://pbs.twimg.com/profile_images/1747638026832887808/ZCUr0JDi_400x400.jpg",
                    matchUrl: `http://www.fawanews.sc/${reactMatchSlug}.html`, // Fake or real? based on the image example
                    playerUrl: `${baseUrl}/${reactMatchSlug}/${serverId}`,
                    streamUrl: streamUrl,
                    serverName: (server.name || server.title || 'Unknown Server').replace(/\s*(-|\|)?\s*Server\s*\d+/i, '').trim() || 'Unknown Server'
                });
            });
        });

        return res.json({
            updatedAt: lastScraped || new Date().toISOString(),
            count: formattedMatches.length,
            matches: formattedMatches
        });
    } catch (err: any) {
        console.error("Match.json handler error:", err);
        return res.status(500).json({
            error: `API Handler Crash: ${err.message}`
        });
    }
}
