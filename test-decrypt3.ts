import fs from 'fs';
const text = fs.readFileSync('test-kickbd_iframe.txt', 'utf8');
const pMatch = text.match(/_p\s*=\s*['"](.*?)['"]/);
const dMatch = text.match(/_d\s*=\s*['"](.*?)['"]/);
console.log("P:", !!pMatch, pMatch ? pMatch[1].substring(0, 30) : "");
console.log("D:", !!dMatch, dMatch ? dMatch[1].substring(0, 30) : "");
