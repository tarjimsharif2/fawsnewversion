import axios from 'axios';
import * as cheerio from 'cheerio';
import vm from 'vm';

async function testDecryption() {
    try {
        const res = await axios.get('https://kickbd.com/source/fox_fifa', { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = res.data;
        
        // Find the script tag containing the payload
        const match = html.match(/var _p\s*=\s*'([^']+)';/);
        const matchD = html.match(/var _d\s*=\s*'([^']+)';/);
        if (match && matchD) {
            let pStr = unescape(match[1]);
            let dStr = unescape(matchD[1]);
            console.log("Found dStr snippet:", dStr.substring(0, 50));
            
            // Execute the decoding function in a fake window environment
            const sandbox = {
                window: { _cf_chl_opt: {} },
                console: { log: console.log, error: console.error },
                unescape: unescape,
                navigator: { userAgent: "Mozilla" }
            };
            
            // dStr is basically an obfuscated function that sets window.mfaab84
            try {
               const context = vm.createContext(sandbox);
               vm.runInContext(dStr, context);
               
               if (context.window.mfaab84) {
                   const result = context.window.mfaab84(pStr);
                   console.log("Decrypted payload snippet:", result.substring(0, 500));
                   
                   // Extract m3u8 from the result
                   const m3u8Match = result.match(/https?:\/\/[^\s"'<>\\]+\.m3u8[^\s"'<>\\]*/i);
                   if (m3u8Match) {
                       console.log("Found stream URL:", m3u8Match[0]);
                   } else {
                       console.log("Stream URL not found in payload.");
                   }
               }
            } catch (err) {
                 console.log("VM Error:", err);
            }
        }
    } catch(e) {
        console.error(e);
    }
}
testDecryption();
