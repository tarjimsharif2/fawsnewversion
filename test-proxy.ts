import axios from 'axios';

async function testFetch() {
    try {
        const url = 'http://localhost:3000/api/proxy?url=http://193.47.62.41/hls/AYYYGd.m3u8&headers=%7B%22Referer%22%3A%22http%3A%2F%2Fwww.fawanews.sc%2F%22%7D';

        console.log("Fetching", url);
        const res = await axios.get(url, {
            timeout: 10000,
            validateStatus: () => true
        });
        console.log(`Status: ${res.status}`);
        console.log("Headers:", res.headers);
        console.log("Data snippet:", res.data ? (typeof res.data === 'string' ? res.data : res.data) : null);
    } catch(e) {
        console.error(e.message);
    }
}
testFetch();
