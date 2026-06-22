import axios from 'axios';
async function test() {
   const res = await axios.get('http://193.47.62.44/hls/zzzz.m3u8', { headers: { Referer: 'http://www.fawanews.sc/' }, validateStatus: () => true });
   console.log("Status:", res.status);
   console.log(res.data);
}
test();
