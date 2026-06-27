import fs from 'fs';
const html = fs.readFileSync('fawa_match2.html', 'utf-8');
const videoMatch = html.match(/var\s+videos\s*=\s*(\[.*?\])/s);
if (videoMatch) {
    try {
        const str = videoMatch[1].replace(/'/g, '"').replace(/,\s*\]/, ']');
        console.log("String to parse length:", str.length);
        const parsedVideos = JSON.parse(str);
        console.log("Parsed:", parsedVideos[0]);
    } catch (e: any) {
        console.error("Failed to parse:", e.message);
    }
}
