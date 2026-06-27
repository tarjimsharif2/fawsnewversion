import express from 'express';
import path from 'path';
import cron from 'node-cron';

// Import our serverless handlers for local dev
import matchesHandler from './api/matches';
import matchJsonHandler from './api/match.json';
import proxyHandler from './api/proxy';
import scrapeHandler from './api/scrape';
import { runScraper } from './api/_scraper';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON bodies (needed for our scrape endpoint or others if they use POST)
app.use(express.json());

// Wire up the Vercel-like handlers to Express
app.all('/api/proxy', (req, res) => proxyHandler(req, res));
app.all('/api/proxy.mp4', (req, res) => proxyHandler(req, res));
app.get('/api/matches', (req, res) => matchesHandler(req, res));
app.get('/api/match.json', (req, res) => matchJsonHandler(req, res));
app.post('/api/scrape', (req, res) => scrapeHandler(req, res));

// Background scraper for local mode
runScraper();
cron.schedule('*/2 * * * *', () => {
    console.log("Triggering scheduled scraping job...");
    runScraper();
});

export default app;

async function startServer() {
    if (process.env.NODE_ENV !== "production") {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Local Server running on port ${PORT}`);
    });
}

startServer();
