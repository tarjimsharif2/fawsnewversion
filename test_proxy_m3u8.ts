import proxyHandler from './api/proxy';

async function test() {
    const m3u8Url = 'https://pul-tenm.nbs3g.com/live/hd-en-1-4460966.m3u8?txSecret=b19f270460748649a7b5304bf7c7d8b0&txTime=6A4061A8';
    const req: any = {
        method: 'GET',
        url: `/api/proxy?url=${encodeURIComponent(m3u8Url)}`,
        query: { url: m3u8Url },
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
