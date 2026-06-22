import axios from 'axios';
async function main() {
    const res = await axios.get('https://backend.footfytv.live/api/matches', { headers: { 'x-footfy-key': '435JH345G345G345G34U5345434J5434535HG' }});
    console.log("Footfy matches count:", res.data.length);
    for (const m of res.data) {
        console.log(`- ${m.homeTeam} vs ${m.awayTeam}`);
        for (const s of m.servers || []) {
             console.log(`  * ${s.url} (${s.type})`);
        }
    }
}
main();
