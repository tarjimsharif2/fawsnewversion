import axios from 'axios';
async function test() {
   const res = await axios.get("https://bl.rutube.ru/livestream/7c13a51576b9ff2601f08f5d57dd5169/index.m3u8?s=uiXES2ePt7xTpQnbJxn7Dg&e=2074684474&scheme=https");
   console.log(res.status, res.headers);
}
test();
