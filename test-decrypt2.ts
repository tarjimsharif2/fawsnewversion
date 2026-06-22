import axios from 'axios';
import * as cheerio from 'cheerio';
import vm from 'vm';

async function testDecryption() {
    try {
        const res = await axios.get('https://kickbd.com/source/fox_fifa', { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = res.data;
        
        console.log("HTML fetched. Length:", html.length);
        const match = html.match(/var _p\s*=\s*'([^']+)';/);
        const matchD = html.match(/var _d\s*=\s*'([^']+)';/);
        console.log("Match P?", !!match);
        console.log("Match D?", !!matchD);
        
        if (match && matchD) {
            let pStr = unescape(match[1]);
            let dStr = unescape(matchD[1]);
            
            const sandbox = {
                window: {},
                console: { log: console.log, error: console.error },
                unescape: unescape,
                String: String
            };
            
            try {
               const context = vm.createContext(sandbox);
               vm.runInContext(dStr + '; window.mfaab84 = mfaab84;', context);
               
               if (context.window.mfaab84) {
                   const result = context.window.mfaab84(pStr);
                   console.log("Decryption success, length:", result.length);
                   const m3u8Match = result.match(/https?:\/\/[^\s"'<>\\]+\.(m3u8|mpd)[^\s"'<>\\]*/i);
                   if (m3u8Match) {
                       console.log("Found stream URL:", m3u8Match[0]);
                   } else {
                       console.log("No stream URL.");
                   }
               }
            } catch (err: any) {
                 console.log("VM Error:", err.message);
                 try {
                     // try just running it
                     const fn = new Function("window", "unescape", dStr + "; return window.mfaab84;");
                     const win: any = {};
                     const mfaab84 = fn(win, unescape);
                     if (mfaab84) {
                         const res2 = mfaab84(pStr);
                         //...
                     }
                 }catch(e2: any) { console.log(e2.message) }
            }
        }
    } catch(e) {
        console.error(e);
    }
}
testDecryption();
