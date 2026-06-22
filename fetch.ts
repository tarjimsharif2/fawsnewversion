import axios from 'axios';
async function run() {
   try {
     const res = await axios.get('https://api3.photocard.fun/api/matches');
     const matches = res.data.matches;
     console.log("Total matches:", matches.length);
     for (const m of matches) {
         if (m.title.includes('Kinondoni')) {
             console.log("Kinondoni Servers length:", m.servers?.length);
             if (m.servers?.length > 0) {
                 console.log("Server 0:", m.servers[0]);
             }
         }
     }
   } catch(e) {
     console.error(e.message);
   }
}
run();
