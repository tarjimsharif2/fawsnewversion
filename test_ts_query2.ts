import axios from 'axios';

async function test() {
    try {
        const url_without_secret = 'https://pul-tenm.nbs3g.com/live/hd-en-1-4460966-1782519211.ts?txspiseq=106165752287743402940';
        let r = await axios.get(url_without_secret, { responseType: 'arraybuffer' });
        const buf = Buffer.from(r.data);
        console.log("Without secret SUCCESS, bytes:", buf.length);
        console.log("First 100 bytes:", buf.subarray(0, 100).toString('hex'));
        console.log("First 100 chars:", buf.subarray(0, 100).toString());
    } catch(e:any) {
        console.log("Without secret FAIL:", e.message);
    }
}
test();
