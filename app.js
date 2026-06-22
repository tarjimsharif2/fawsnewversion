// Root app.js for cPanel Node.js deployments
import('./dist/server.cjs').catch(err => {
    console.error("Failed to start server from dist/server.cjs", err);
});
