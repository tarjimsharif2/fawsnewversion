import axios from 'axios';

async function main() {
    const res = await axios.get('https://kickbd.com/matches/iframe/fifa-world-cup-match');
    const match = res.data.match(/var tvChannels\s*=\s*(\{.*?\})\s*;/);
    if (match) {
        console.log("Found tvChannels!");
        console.log(JSON.parse(match[1]));
    } else {
        console.log("tvChannels not found in page.");
    }
}
main();
