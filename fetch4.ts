import axios from 'axios';
async function test() {
    const { data } = await axios.get('http://www.fawanews.sc/FIFA_world_cup_2026_Spain_vs_Cape_Verde_eng.html');
    const videosMatch = data.match(/var\s+videos\s*=\s*(\[.*?\])/s);
    if (videosMatch) {
        console.log(videosMatch[1]);
        let jsonStr = videosMatch[1].replace(/'/g, '"').replace(/,\s*\]/, ']');
        const v = JSON.parse(jsonStr);
        console.log("length:", v.length);
        console.log(v);
    }
}
test();
