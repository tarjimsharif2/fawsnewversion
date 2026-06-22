const m3u8Content = `
#EXTM3U
#EXT-X-VERSION:3
#EXTINF:4.800,
AYYYGd-2033.ts
`;
const targetUrl = "http://193.47.62.41/hls/AYYYGd.m3u8";

const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
const rootUrl = new URL(targetUrl).origin;

const rewritten = m3u8Content.split('\n').map(line => {
    const t = line.trim();
    if (t.startsWith('#') || !t) return line;
    
    if (t.startsWith('http://') || t.startsWith('https://')) return line;
    if (t.startsWith('/')) return rootUrl + t;
    return baseUrl + t;
}).join('\n');

console.log(rewritten);
