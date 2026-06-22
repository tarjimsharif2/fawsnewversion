import axios from 'axios';

async function main() {
    try {
        const res = await axios.get('https://kickbd.com/source/fox_fifa');
        const text = res.data;
        const matches = text.match(/https?:\/\/[^"']+\.m3u8[^"']*/g);
        console.log("Found m3u8 direct?", matches);
    } catch(err) {
        console.log(err);
    }
}
main();
