import * as cheerio from 'cheerio';
import fs from 'fs';

const html = fs.readFileSync('kickbd-home.html', 'utf-8');
const $ = cheerio.load(html);

$('a[href*="/matches/"]').each((i, el) => {
    if ($(el).attr('href')?.includes('/upcoming')) return;
    
    console.log("-------------------");
    console.log("HREF:", $(el).attr('href'));
    // Look for images
    const images: string[] = [];
    $(el).find('img').each((j, img) => images.push($(img).attr('src') || ''));
    console.log("Images:", images);

    // Look for spans or divs with text
    const texts: string[] = [];
    $(el).find('div, span, p').each((j, node) => {
        const text = $(node).text().trim();
        if (text && !texts.includes(text) && text.length > 2) {
            texts.push(text.replace(/\s+/g, ' '));
        }
    });
    console.log("Texts:", texts);
});
