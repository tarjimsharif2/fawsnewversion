import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
   const { data } = await axios.get('http://www.fawanews.sc/');
   const $ = cheerio.load(data);
   const matches = [];
   $('.user-item').each((i, el) => {
       const href = $(el).find('a').attr('href');
       const title = $(el).find('.user-item__name').text().trim();
       matches.push({ title, href });
   });
   const sp = matches.filter(m => m.title.includes('Spain vs') || m.title.includes('Cape Verde'));
   console.log(sp);
}
test();
