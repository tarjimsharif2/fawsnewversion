import axios from 'axios';

async function getMatches() {
    try {
        const response = await axios.get('https://backend.footfytv.live/api/matches', {
            headers: {
                'x-footfy-key': '435JH345G345G345G34U5345434J5434535HG'
            }
        });
        const url = response.data;
        const match = url.find((m: any) => 
            m.title?.toLowerCase().includes('sco') || 
            m.homeTeam?.toLowerCase().includes('sco')
        );
        console.log("MATCH:", match?.title, match?.homeTeam, match?.awayTeam);
        if (match) {
            match.servers.forEach((s: any) => {
                console.log(` SERVER [${s.name}]: url=${s.url} streamUrl=${s.streamUrl} headers=${JSON.stringify(s.headers)}`);
            });
        }
    } catch(e: any) {
        console.log("ERROR", e.message);
    }
}
getMatches();
