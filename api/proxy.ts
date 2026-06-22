import axios from 'axios';

export default async function handler(req: any, res: any) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        return res.status(200).end();
    }

    try {
        let targetUrl = req.query.url;
        if (!targetUrl) {
            const match = req.url?.match(/url=([^&]+)/);
            if (match) targetUrl = decodeURIComponent(match[1]);
        }
        if (!targetUrl) return res.status(400).send('URL is required');

        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            console.error('Proxy error: Invalid URL scheme:', targetUrl);
            return res.status(400).send('Invalid URL');
        }

        let headers: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };

        if (req.query.headers) {
            try { 
                const parsed = JSON.parse(req.query.headers as string);
                headers = { ...headers, ...parsed };
            } catch (e) {}
        }
        
        const forwardedHeaders = ['range', 'accept', 'accept-language', 'content-type'];
        for (const h of forwardedHeaders) {
            if (req.headers[h]) headers[h] = req.headers[h] as string;
        }

        let data = undefined;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
             // In Vercel, req.body is parsed.
             data = req.body; 
        }

        const response = await axios({
            method: req.method,
            url: targetUrl,
            responseType: 'stream', // STREAM to drastically reduce Vercel memory/Gb-Hrs usage
            headers: headers,
            data: data,
            maxRedirects: 5,
            decompress: false,
            validateStatus: () => true 
        });

        res.status(response.status);
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        const hopByHopHeaders = ['connection', 'keep-alive', 'transfer-encoding', 'te', 'trailer', 'proxy-authorization', 'proxy-authenticate', 'upgrade', 'access-control-allow-origin', 'access-control-expose-headers'];
        
        const exposedHeaders: string[] = [];
        for (const [key, value] of Object.entries(response.headers)) {
            if (!hopByHopHeaders.includes(key.toLowerCase()) && value !== undefined) {
                res.setHeader(key, value as string);
                exposedHeaders.push(key);
            }
        }
        res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(', '));
        
        // If m3u8, rewrite relative URLs to absolute URLs so the player resolves them correctly
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('mpegurl') || targetUrl.includes('.m3u8')) {
            res.removeHeader('content-length');
            let m3u8Content = '';
            response.data.on('data', (chunk: Buffer) => { m3u8Content += chunk.toString(); });
            response.data.on('end', () => {
                const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
                const rootUrl = new URL(targetUrl).origin;
                
                const rewritten = m3u8Content.split('\n').map(line => {
                    const t = line.trim();
                    if (t.startsWith('#') || !t) return line;
                    
                    // Sometimes there are URIs in EXT-X lines like #EXT-X-STREAM-INF or #EXT-X-MAP:URI="init.mp4"
                    // but for basic segments, they are just lines without #
                    if (t.startsWith('http://') || t.startsWith('https://')) return line;
                    if (t.startsWith('/')) return rootUrl + t;
                    return baseUrl + t;
                }).join('\n');
                
                // Also rewrite URIs inside EXT-X tags (like #EXT-X-STREAM-INF, #EXT-X-MAP, etc) if they have URI="..."
                const reURL = rewritten.replace(/URI="(.*?)"/g, (match, uri) => {
                     if (uri.startsWith('http://') || uri.startsWith('https://')) return match;
                     if (uri.startsWith('/')) return `URI="${rootUrl}${uri}"`;
                     return `URI="${baseUrl}${uri}"`;
                });
                
                res.send(reURL);
            });
            return;
        }

        // Pipe stream directly for normal chunks to save Vercel bandwidth memory
        response.data.pipe(res);
    } catch (error: any) {
        console.error('Proxy error:', error.message);
        res.status(500).send('Proxy error');
    }
}
