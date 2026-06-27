import axios from 'axios';

async function test() {
    try {
        const u1 = 'https://live06.zuqiu106.com/live/79635460.m3u8'; // This might 404 if stream ended, let's just see.
        let r = await axios.get(u1);
        console.log("u1 success:", r.data.substring(0, 100));
    } catch(e: any) {
        console.log("u1 fail:", e.message);
    }
}
test();
