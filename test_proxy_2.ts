import axios from 'axios';
async function test() {
   const res = await axios.get('http://localhost:3000/api/proxy?url=http%3A%2F%2F193.47.62.44%2Fhls%2Fzzzz.m3u8&headers=%7B%22Referer%22%3A%22http%3A%2F%2Fwww.fawanews.sc%2F%22%7D', { validateStatus:()=>true });
   console.log("Status:", res.status);
   console.log(res.data);
}
test();
