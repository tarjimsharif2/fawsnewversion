import axios from 'axios';
async function test() {
   const { data } = await axios.get('http://www.fawanews.sc/');
   const matches = data.match(/href="([^"]+\.html)"/g);
   console.log([...new Set(matches)]);
}
test();
