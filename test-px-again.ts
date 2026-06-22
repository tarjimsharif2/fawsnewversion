import axios from 'axios';
async function testProxiesAgain() {
    const tsUrl = "https://river-6-604.rtbcdn.ru/stream/genetta-419.ntv.rutube.ru/bOEiVmQ_9Zy6XpPMMj3efA/1781954803/7c13a51576b9ff2601f08f5d57dd5169/360p/seg_20260613_142553-0873.ts";
    const proxies = [
        "https://api.codetabs.com/v1/proxy/?quest=",
        "https://cors-anywhere.herokuapp.com/"
    ];
    for (const p of proxies) {
         try {
             const res = await axios.get(p + encodeURIComponent(tsUrl), { headers: { Origin: "https://eplayhdapiv21.vercel.app"}});
             console.log(p, "STATUS:", res.status);
         } catch(e: any) {
             console.log(p, "FAIL", e.message);
         }
    }
}
testProxiesAgain();
