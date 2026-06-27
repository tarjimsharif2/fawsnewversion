import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Match, ServerLink } from '../src/types';

let scrapedMatches: Match[] = [];
let lastScrapedTime: string | null = null;
let lastScrapeError: string | null = null;
let activeScrapePromise: Promise<void> | null = null;

export const needsRefresh = () => {
    if (scrapedMatches.length === 0) return true;
    if (lastScrapedTime) {
        const lastScraped = new Date(lastScrapedTime).getTime();
        const now = Date.now();
        if (now - lastScraped > 2 * 60 * 1000) { // 2 minutes
            return true;
        }
    }
    return false;
};

export const runScraper = async () => {
    if (activeScrapePromise) {
        await activeScrapePromise;
        return;
    }

    activeScrapePromise = (async () => {
        console.log("Running scraper at", new Date().toISOString());
        lastScrapeError = null;
        
        let errors: string[] = [];
        let parsedMatches: Match[] = [];

        try {
            console.log("Fetching fawanews");
            let htmlData = '';
            try {
                let res = await axios.get('http://www.fawanews.sc/', {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    },
                    timeout: 8000
                });
                htmlData = res.data;
            } catch (e: any) {
                console.log("Direct fetch failed, using proxy fallback...");
                let res = await axios.get('https://corsproxy.org/?http://www.fawanews.sc/', {
                    timeout: 15000
                });
                htmlData = res.data;
            }
            
            const $ = cheerio.load(htmlData);
            const matchesToProcess: any[] = [];
            
            const addedSlugs = new Set();
            $('.user-item').each((i, el) => {
                const anchor = $(el).find('a').first();
                const hrefRaw = anchor.attr('href');
                if (!hrefRaw) return;
                
                const rawSlug = hrefRaw.replace('.html', '');
                if (addedSlugs.has(rawSlug)) return;
                addedSlugs.add(rawSlug);
                
                const href = hrefRaw.startsWith('http') ? hrefRaw : `http://www.fawanews.sc/${hrefRaw}`;
                const title = $(el).find('.user-item__name').text().trim();
                const playing = $(el).find('.user-item__playing').text().trim();
                const img = $(el).find('img').attr('src');
                
                if (title && playing && href.includes('.html')) {
                    let timeStr = '';
                    const timeMatch = playing.match(/\d{2}:\d{2}/);
                    if (timeMatch) timeStr = timeMatch[0];
                    
                    let homeTeam = title;
                    let awayTeam = 'TBD';
                    if (title.includes(' vs ')) {
                        const parts = title.split(' vs ');
                        homeTeam = parts[0].trim();
                        awayTeam = parts[1].trim();
                    } else if (title.includes(' - ')) {
                        const parts = title.split(' - ');
                        homeTeam = parts[0].trim();
                        awayTeam = parts[1].trim();
                    }
                    
                    let serverSuffix = '';
                    if (awayTeam.includes(' --- ')) {
                        const p = awayTeam.split(' --- ');
                        awayTeam = p[0].trim();
                        serverSuffix = p[1].trim();
                    } else if (awayTeam.includes(' -- ')) {
                        const p = awayTeam.split(' -- ');
                        awayTeam = p[0].trim();
                        serverSuffix = p[1].trim();
                    }

                    const trueSlug = `${homeTeam}-${awayTeam}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    
                    matchesToProcess.push({
                        id: trueSlug,
                        title: `${homeTeam} vs ${awayTeam}`,
                        shortTitle: title,
                        slug: trueSlug,
                        sport: 'Football',
                        competition: playing.replace(timeStr, '').trim(),
                        time: timeStr || new Date().toISOString(),
                        status: 'Upcoming',
                        isLive: false,
                        isPinned: false,
                        homeTeam: homeTeam,
                        awayTeam: awayTeam,
                        homeLogo: img || '',
                        awayLogo: img || '',
                        href: href,
                        serverSuffix: serverSuffix
                    });
                }
            });

            // Group matches by true slug
            const uniqueMatchesMap = new Map<string, any>();
            for (const m of matchesToProcess) {
                if (!uniqueMatchesMap.has(m.slug)) {
                    uniqueMatchesMap.set(m.slug, {
                         ...m,
                         fawaLinks: []
                    });
                }
                uniqueMatchesMap.get(m.slug).fawaLinks.push({ href: m.href, suffix: m.serverSuffix });
            }
            const uniqueMatches = Array.from(uniqueMatchesMap.values());
            
            // Now fetch match html for each match to extract streams
            // We do this in chunks to avoid overwhelming the server or Node
            const chunkSize = 5;
            for (let i = 0; i < uniqueMatches.length; i += chunkSize) {
                const chunk = uniqueMatches.slice(i, i + chunkSize);
                await Promise.all(chunk.map(async (match) => {
                    let servers: ServerLink[] = [];
                    let serverCount = 1;
                    
                    // fetch all fawaLinks for this match concurrently
                    let extractedMap: Record<string, any> = {};
                    const linkPromises = match.fawaLinks.map(async (linkObj: any) => {
                        try {
                            let fetchUrl = linkObj.href.replace(/ /g, '%20');
                            let html = '';
                            let matchResStatus = 0;
                            try {
                                let matchRes = await axios.get(fetchUrl, { timeout: 8000, validateStatus: () => true });
                                html = matchRes.data;
                                matchResStatus = matchRes.status;
                            } catch (e: any) {
                                console.log("Error fetching match directly, using proxy fallback:", e.message);
                                try {
                                    let matchRes = await axios.get('https://corsproxy.org/?' + encodeURIComponent(fetchUrl), { timeout: 15000, validateStatus: () => true });
                                    html = matchRes.data;
                                    matchResStatus = matchRes.status;
                                } catch (proxyError: any) {
                                    console.log("Proxy also failed:", proxyError.message);
                                }
                            }

                            if (matchResStatus === 200 && typeof html === 'string') {
                                const videoMatch = html.match(/var\s+videos\s*=\s*(\[.*?\])/s);
                                
                                if (videoMatch) {
                                    try {
                                        const parsedVideos = JSON.parse(videoMatch[1].replace(/'/g, '"').replace(/,\s*\]/, ']'));
                                        if (Array.isArray(parsedVideos) && parsedVideos.length > 0) {
                                            let streamUrl = parsedVideos[0];
                                            if (streamUrl) {
                                                const isDash = streamUrl.includes('.mpd');
                                                extractedMap[linkObj.href] = {
                                                    streamUrl: streamUrl,
                                                    type: isDash ? 'dash' : 'm3u8'
                                                };
                                            }
                                        }
                                    } catch (e) {
                                        console.error(`Failed to parse videos for ${linkObj.href}`, e);
                                    }
                                }
                            }
                        } catch (e) {
                            console.error(`Failed to fetch match link ${linkObj.href}`, e);
                        }
                    });

                    await Promise.all(linkPromises);
                    
                    const uniqueServerUrls = new Set<string>();
                    const dedupedServers: ServerLink[] = [];
                    let serverCounter = 1;
                    
                    for (const linkObj of match.fawaLinks) {
                        const url = linkObj.href;
                        const ext = extractedMap[url];
                        
                        const streamUrl = ext ? ext.streamUrl : '';
                        const type = streamUrl ? (ext ? ext.type : 'm3u8') : 'iframe';
                        
                        const checkUrl = streamUrl || url || '';
                        
                        if (checkUrl && uniqueServerUrls.has(checkUrl)) {
                            continue;
                        }
                        if (checkUrl) {
                            uniqueServerUrls.add(checkUrl);
                        }
                        
                        dedupedServers.push({
                            id: `${match.slug}-stream-${serverCounter}`,
                            name: `Stream ${serverCounter}${linkObj.suffix ? ` (${linkObj.suffix})` : ''}`,
                            url: url,
                            streamUrl: streamUrl,
                            externalUrl: '',
                            type: type,
                            quality: 'Auto',
                            headers: { "Referer": "http://www.fawanews.sc/" },
                            drm: null,
                            drmKey: null
                        });
                        serverCounter++;
                    }

                    match.servers = dedupedServers;
                    delete match.fawaLinks;
                    delete match.serverSuffix;
                    delete match.href;
                }));
            }
            
            parsedMatches = uniqueMatches as Match[];

        } catch (error: any) {
            const statusStr = error.response ? ` (${error.response.status}: ${error.response.statusText})` : '';
            errors.push(`HTML Scraper failed: ${error.message}${statusStr}`);
        }

        if (parsedMatches.length > 0) {
            const validatePromises: (() => Promise<void>)[] = [];
            
            // Prepare validation tasks
            for (const match of parsedMatches) {
                for (const server of match.servers) {
                    if (server.streamUrl || server.url) {
                        const targetUrl = server.streamUrl || server.url;
                        (server as any).isValidating = true;
                        (server as any).isWorking = false;
                        
                        validatePromises.push(async () => {
                            const defaultHeaders = {
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
                                "Referer": "http://www.fawanews.sc/"
                            };
                            try {
                                const res = await axios.get(targetUrl, {
                                    headers: { ...defaultHeaders, ...(server.headers || {}) },
                                    timeout: 10000,
                                    responseType: 'text',
                                    validateStatus: (status) => status < 500
                                });
                                let html = res.data;
                                if (typeof html === 'string' && html.includes('var videos =')) {
                                    const videoMatch = html.match(/var\s+videos\s*=\s*(\[.*?\])/s);
                                    if (videoMatch) {
                                        try {
                                            const parsedVideos = JSON.parse(videoMatch[1].replace(/'/g, '"').replace(/,\s*\]/, ']'));
                                            if (Array.isArray(parsedVideos) && parsedVideos.length > 0 && parsedVideos[0]) {
                                                server.streamUrl = parsedVideos[0];
                                                server.type = server.streamUrl.includes('.mpd') ? 'dash' : 'm3u8';
                                            }
                                        } catch(e) {}
                                    }
                                } else if (typeof html === 'string' && html.includes('_p') && html.includes('_d')) {
                                    const pMatch = html.match(/_p\s*=\s*['"](.*?)['"]/);
                                    const dMatch = html.match(/_d\s*=\s*['"](.*?)['"]/);
                                    if (pMatch && dMatch) {
                                        try {
                                            const fn = new Function('window', 'unescape', 'pStr', `
                                                try {
                                                   ${unescape(dMatch[1])}
                                                   if (typeof window.mfaab84 === "function") return window.mfaab84(pStr);
                                                } catch(e){}
                                                return null;
                                            `);
                                            const result = fn({}, unescape, unescape(pMatch[1]));
                                            if (result) {
                                                const streamMatch = result.match(/https?:\/\/[^\s"'<>\\]+\.(m3u8|mpd)[^\s"'<>\\]*/i);
                                                if (streamMatch) {
                                                    server.streamUrl = streamMatch[0];
                                                    server.type = streamMatch[0].includes('.mpd') ? 'dash' : 'm3u8';
                                                    
                                                    const kidMatch = result.match(/k_id\s*=\s*['"]([^'"]+)['"]/);
                                                    const kvMatch = result.match(/k_v\s*=\s*['"]([^'"]+)['"]/);
                                                    if (kidMatch && kvMatch) {
                                                        server.drmKey = [{ keyId: kidMatch[1], key: kvMatch[1] }];
                                                    }
                                                }
                                            }
                                        } catch(e) {}
                                    }
                                }
                                
                                if (res.status >= 200 && res.status < 400 && html) {
                                    const isM3u8 = typeof html === 'string' && html.includes('#EXTM3U');
                                    const isHtmlPlayer = typeof html === 'string' && html.includes('<html'); 
                                    if (isM3u8 || isHtmlPlayer || server.streamUrl) {
                                        (server as any).isWorking = true;
                                    } else if (res.status === 200) {
                                        (server as any).isWorking = true;
                                    } else {
                                        (server as any).isWorking = false;
                                    }
                                } else {
                                    (server as any).isWorking = false;
                                }
                            } catch(err) {
                                (server as any).isWorking = false;
                            } finally {
                                (server as any).isValidating = false;
                            }
                        });
                    } else {
                        (server as any).isWorking = false;
                        (server as any).isValidating = false;
                    }
                }
            }

            // Run validations with concurrency limit of 3
            const limit = 3;
            for (let i = 0; i < validatePromises.length; i += limit) {
                const chunk = validatePromises.slice(i, i + limit);
                await Promise.allSettled(chunk.map(fn => fn()));
                // Add a small delay between chunks to avoid rate limiting
                if (i + limit < validatePromises.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            scrapedMatches = parsedMatches;
            lastScrapedTime = new Date().toISOString();
            lastScrapeError = null;
        } else {
            lastScrapeError = errors.join(" || ");
            console.error("All scraper attempts failed:", lastScrapeError);
            // Update lastScrapedTime even on failure so we don't infinitely retry!
            lastScrapedTime = new Date().toISOString();
        }
    })();

    try {
        await activeScrapePromise;
    } finally {
        activeScrapePromise = null;
    }
};

export const getCachedMatches = () => {
    return {
        lastScraped: lastScrapedTime,
        matches: scrapedMatches,
        error: lastScrapeError
    };
};
