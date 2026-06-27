import axios from 'axios';
async function test() {
    try {
        let r = await axios.get('http://www.fawanews.sc/FIFA_world_cup_2026_Cape_Verde_vs_Saudi_Arabia_hd1.html');
        const html = r.data;
        if (html.includes('var videos =')) {
            const v = html.match(/var\s+videos\s*=\s*(\[.*?\])/s);
            console.log("Found videos:", v?.[1]);
        } else if (html.includes('_p') && html.includes('_d')) {
            console.log("Found _p and _d");
        } else {
            console.log("Found something else. Snippet:", html.substring(0, 1000));
        }
    } catch(e:any) {
        console.log("Error:", e.message);
    }
}
test();
