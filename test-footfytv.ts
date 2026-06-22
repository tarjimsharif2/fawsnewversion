import axios from 'axios';

async function main() {
    try {
        const response = await axios.get('https://backend.footfytv.live/api/matches', {
            headers: {
                'x-footfy-key': '435JH345G345G345G34U5345434J5434535HG'
            },
            timeout: 5000
        });
        console.log("Success!", response.status);
    } catch(err: any) {
        console.log("Failed:", err.message);
    }
}
main();
