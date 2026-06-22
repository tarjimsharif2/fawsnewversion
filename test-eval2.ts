import axios from 'axios';
async function main() {
    const res = await axios.get('https://kickbd.com/source/fox_fifa', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const pMatch = res.data.match(/_p\s*=\s*['"](.*?)['"]/);
    const dMatch = res.data.match(/_d\s*=\s*['"](.*?)['"]/);
    if (pMatch && dMatch) {
         const fn = new Function('window', 'unescape', 'pStr', `
             ${unescape(dMatch[1])} return window.mfaab84 ? window.mfaab84(pStr) : null;
         `);
         const result = fn({}, unescape, unescape(pMatch[1]));
         console.log(result.substring(0, 1000));
    }
}
main();
