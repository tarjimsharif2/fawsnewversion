import axios from 'axios';
import proxyHandler from './api/proxy';

async function test() {
    const req: any = {
        method: 'GET',
        url: '/api/proxy?url=https%3A%2F%2Flive06.zuqiu106.com%2Flive%2F79635460-1782511366.ts',
        query: { url: 'https://live06.zuqiu106.com/live/79635460-1782511366.ts' },
        headers: { host: 'localhost' }
    };

    let bodyLength = 0;
    return new Promise((resolve) => {
        const res: any = {
            status: (code: number) => { console.log("status:", code); return res; },
            setHeader: (k: string, v: string) => { },
            removeHeader: (k: string) => { },
            send: (d: any) => { bodyLength += d.length; resolve(bodyLength); },
            write: (d: any) => { bodyLength += d.length; },
            end: () => { resolve(bodyLength); },
            on: () => {},
            once: () => {},
            emit: () => {}
        };
        proxyHandler(req, res);
    }).then(b => console.log("Total bytes:", b));
}
test();
