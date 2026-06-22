import axios from 'axios';
import vm from 'vm';

async function main() {
    const res = await axios.get('https://kickbd.com/source/fox_fifa', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = res.data;
    
    const pMatch = html.match(/_p\s*=\s*['"](.*?)['"]/);
    const dMatch = html.match(/_d\s*=\s*['"](.*?)['"]/);
    
    if (pMatch && dMatch) {
         const pStr = unescape(pMatch[1]);
         const dStr = unescape(dMatch[1]);
         
         const fn = new Function('window', 'unescape', 'pStr', `
             ${dStr}
             if (typeof window.mfaab84 === "function") {
                 return window.mfaab84(pStr);
             }
             return null;
         `);
         const win: any = {};
         const result = fn(win, unescape, pStr);
         if (result) {
             const m3u8Match = result.match(/https?:\/\/[^\s"'<>\\]+\.(m3u8|mpd)[^\s"'<>\\]*/i);
             console.log("Stream:", m3u8Match ? m3u8Match[0] : "Not found");
         } else {
             console.log("Failed to evaluate");
         }
    }
}
main();
