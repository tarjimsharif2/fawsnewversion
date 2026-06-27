import axios from 'axios';
async function test() {
    let r = await axios.get('http://www.fawanews.sc/FIFA_world_cup_2026_Cape_Verde_vs_Saudi_Arabia_hd1.html');
    console.log(r.data);
}
test();
