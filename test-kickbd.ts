import axios from 'axios';

async function test(url: string) {
    try {
        console.log(`Testing ${url}`);
        const res = await axios.get(url, { 
            headers: { 'x-footfy-key': '435JH345G345G345G34U5345434J5434535HG' },
            timeout: 5000 
        });
        console.log(`Success! Status: ${res.status}`);
    } catch (err: any) {
        console.log(`Failed for ${url}: ${err.message} ${err.response?.status || ''}`);
    }
}

async function main() {
    await test('https://api.kickbd.com/api/matches');
    await test('https://api.kickbd.com/matches');
    await test('https://kickbd.com/api/v1/matches');
    await test('https://admin.kickbd.com/api/matches');
}

main();
