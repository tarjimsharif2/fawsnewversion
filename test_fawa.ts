import axios from 'axios';
async function test() {
    let res = await axios.get('http://www.fawanews.sc/');
    console.log(res.data.substring(0, 500));
}
test();
