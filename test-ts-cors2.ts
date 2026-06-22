import axios from 'axios';

async function testTsCorsAgain() {
    try {
        const tsUrl = "https://river-6-604.rtbcdn.ru/stream/genetta-419.ntv.rutube.ru/bOEiVmQ_9Zy6XpPMMj3efA/1781954803/7c13a51576b9ff2601f08f5d57dd5169/360p/seg_20260613_142553-0873.ts";
        const tsReq = await axios.get(tsUrl, {
             headers: {
                  Origin: "https://eplayhdapiv21.vercel.app",
                  Referer: "https://eplayhdapiv21.vercel.app/"
             }
        });
        console.log("TS CORS ALLOW ORIGIN:", tsReq.headers['access-control-allow-origin']);
        console.log("TS STATUS:", tsReq.status);
    } catch(e: any) {
        console.log("ERROR", e.response ? e.response.status : e.message);
    }
}
testTsCorsAgain();
