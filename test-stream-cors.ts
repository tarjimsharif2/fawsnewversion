import axios from 'axios';

async function testFetch() {
    try {
        const url = 'http://193.47.62.41/hls/AYYYGd.m3u8';
        console.log("Fetching", url);
        const res = await axios.get(url, {
            headers: {
                'Referer': 'http://www.fawanews.sc/'
            },
            timeout: 10000,
            validateStatus: () => true
        });
        console.log(`Status: ${res.status}`);
        console.log("Headers:", res.headers);
        console.log("Data snippet:", res.data ? res.data.substring(0, 100) : null);
    } catch(e) {
        console.error(e.message);
    }
}
testFetch();
