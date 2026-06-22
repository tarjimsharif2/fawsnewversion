import * as cheerio from 'cheerio';
import fs from 'fs';

const html = fs.readFileSync('kickbd-home.html', 'utf-8');
const $ = cheerio.load(html);

$('a[href*="/matches/"]').each((i, el) => {
    if ($(el).attr('href')?.includes('/upcoming')) return;
    
    console.log("-------------------");
    const teams: string[] = [];
    $(el).find('img').each((j, img) => {
        const alt = $(img).attr('alt') || '';
        if (alt) teams.push(alt);
    });
    console.log("Team alts:", teams);

    $(el).find('p').each((j, p) => {
        console.log(`p class='${$(p).attr('class')}' -> ${$(p).text().trim()}`);
    });
    
    $(el).find('span').each((j, span) => {
        console.log(`span class='${$(span).attr('class')}' -> ${$(span).text().trim()}`);
    });
    
    $(el).find('div').each((j, div) => {
        if (!$(div).children().length || ($(div).children('span').length > 0)) {
           // console.log(`div class='${$(div).attr('class')}' text='${$(div).text().trim()}'`);
        }
    });
});
