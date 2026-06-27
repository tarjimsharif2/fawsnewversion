import axios from 'axios';

async function test() {
    try {
        const u = 'https://pul-tenm.nbs3g.com/live/hd-en-1-4460966.m3u8?txSecret=b19f270460748649a7b5304bf7c7d8b0&txTime=6A4061A8';
        let r = await axios.get(u);
        console.log(r.data.substring(0, 500));
    } catch(e:any) {
        console.log(e.message);
    }
}
test();
