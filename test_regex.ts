import fs from 'fs';
const html = fs.readFileSync('fawa_match5.html', 'utf-8');
const videoMatch = html.match(/var\s+videos\s*=\s*(\[.*?\])/s);
if (videoMatch) {
    try {
        console.log("Raw match:", videoMatch[1]);
        const parsedVideos = JSON.parse(videoMatch[1].replace(/'/g, '"').replace(/,\s*\]/, ']'));
        console.log("Parsed:", parsedVideos);
        if (Array.isArray(parsedVideos) && parsedVideos.length > 0 && parsedVideos[0]) {
            console.log("Extracted URL:", parsedVideos[0]);
        }
    } catch (e) {
        console.error("Failed to parse videos array", e);
    }
} else {
    console.log("No match found");
}
