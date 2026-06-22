import axios from 'axios';

async function testProxies() {
    const tsUrl = "https://river-6-604.rtbcdn.ru/stream/genetta-419.ntv.rutube.ru/bOEiVmQ_9Zy6XpPMMj3efA/1781954803/7c13a51576b9ff2601f08f5d57dd5169/360p/seg_20260613_142553-0873.ts";

    const proxies = [
        "https://cors.zme.workers.dev/?",
        "https://api.allorigins.win/raw?url=",
        "https://cors-proxy.fringe.zone/",
        "https://api.codetabs.com/v1/proxy/?quest="
    ];

    for (const p of proxies) {
        try {
            console.log("Testing:", p);
            const res = await axios.get(p + encodeURIComponent(tsUrl), { timeout: 5000 });
            console.log("SUCCESS:", p, res.status, res.data ? res.data.length : 'no data');
        } catch (e: any) {
            console.log("FAIL:", p, e.message);
        }
    }
}
testProxies();
