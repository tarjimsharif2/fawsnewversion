import axios from 'axios';

async function testFootfyProxy() {
    try {
        const url = encodeURIComponent("https://river-6-604.rtbcdn.ru/stream/genetta-419.ntv.rutube.ru/bOEiVmQ_9Zy6XpPMMj3efA/1781954803/7c13a51576b9ff2601f08f5d57dd5169/360p/seg_20260613_142553-0873.ts");
        const res = await axios.get(`https://backend.footfytv.live/proxy?url=${url}`, {
             headers: { 
                 Origin: "https://footfytv.live",
                 Referer: "https://footfytv.live/"
             }
        });
        console.log("FOOTFY PROXY STATUS:", res.status);
        console.log("CORS:", res.headers['access-control-allow-origin']);
    } catch(e: any) {
        if(e.response) {
            console.log("ERROR STATUS:", e.response.status);
        } else {
            console.log("ERROR:", e.message);
        }
    }
}
testFootfyProxy();
