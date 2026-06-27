import axios from 'axios';
async function test() {
    let r = await axios.get('http://www.fawanews.sc/FIFA_world_cup_2026_Cape_Verde_vs_Saudi_Arabia_fr_hd.html');
    const html = r.data;
    if (html.includes('var videos =')) {
        const v = html.match(/var\s+videos\s*=\s*(\[.*?\])/s);
        console.log("Found videos:", v?.[1]);
    } else {
        console.log("No videos found.");
    }
}
test();
