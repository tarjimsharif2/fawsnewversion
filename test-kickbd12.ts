import axios from 'axios';

async function main() {
    try {
        const res = await axios.get('https://kickbd.com/source/fox_fifa', { timeout: 10000 });
        console.log("Status:", res.status);
        console.log("Data size:", res.data.length);
        console.log(res.data.substring(0, 500));
    } catch (err: any) {
        console.log("Error:", err.message);
    }
}
main();
