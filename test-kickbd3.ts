import axios from 'axios';

async function main() {
    try {
        const res = await axios.get('https://kickbd.com', { timeout: 10000 });
        console.log("Success fetching kickbd.com!");
        console.log(res.data.substring(0, 1000));
    } catch (err: any) {
        console.log("Error:", err.message);
    }
}

main();
