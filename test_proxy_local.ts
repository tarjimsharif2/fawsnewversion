import axios from 'axios';
import proxyHandler from './api/proxy';

async function test() {
    const req: any = {
        method: 'GET',
        url: '/api/proxy?url=https%3A%2F%2Flive06.zuqiu106.com%2Flive%2F79635460.m3u8',
        query: { url: 'https://live06.zuqiu106.com/live/79635460.m3u8' },
        headers: { host: 'localhost' }
    };

    let body = '';
    return new Promise((resolve) => {
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
    }).then(b => console.log("body:", b));
}
test();
