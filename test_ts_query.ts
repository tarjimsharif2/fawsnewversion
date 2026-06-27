import axios from 'axios';

async function test() {
    try {
        const url_without_secret = 'https://pul-tenm.nbs3g.com/live/hd-en-1-4460966-1782519058.ts?txspiseq=106165752287743402940';
        let r = await axios.get(url_without_secret, { responseType: 'arraybuffer' });
        console.log("Without secret SUCCESS, bytes:", r.data.byteLength);
    } catch(e:any) {
        console.log("Without secret FAIL:", e.message);
    }
}
test();
