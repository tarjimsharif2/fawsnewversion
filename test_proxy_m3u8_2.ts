import proxyHandler from './api/proxy';

async function test() {
    const m3u8Url = 'http://193.47.62.47/hls/JJJJQQ.m3u8';
    const req: any = {
        method: 'GET',
        url: `/api/proxy?url=${encodeURIComponent(m3u8Url)}&headers=${encodeURIComponent(JSON.stringify({"Referer": "http://www.fawanews.sc/"}))}`,
        query: { url: m3u8Url, headers: JSON.stringify({"Referer": "http://www.fawanews.sc/"}) },
        headers: { host: 'localhost' }
    };

    let body = '';
    await new Promise((resolve) => {
        const res: any = {
            status: (code: number) => { console.log("status:", code); return res; },
            setHeader: (k: string, v: string) => { },
            removeHeader: (k: string) => { },
            send: (d: any) => { body += d; resolve(body); },
            write: (d: any) => { body += d; },
            end: () => { resolve(body); },
            on: () => {},
            once: () => {},
            emit: () => {}
        };
        proxyHandler(req, res);
    });
    console.log("proxy output:\\n", body);
}
test();
