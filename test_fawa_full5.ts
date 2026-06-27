import axios from 'axios';
import fs from 'fs';
async function test() {
    let r = await axios.get('http://www.fawanews.sc/FIFA_world_cup_2026_Cape_Verde_vs_Saudi_Arabia_fr_hd.html');
    fs.writeFileSync('fawa_match5.html', r.data);
}
test();
