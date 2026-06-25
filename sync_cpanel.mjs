import fs from 'fs';
import path from 'path';

function copyDirStructure(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirStructure(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

if (fs.existsSync('dist/assets')) {
    if (fs.existsSync('cpanel_ready/assets')) {
        fs.rmSync('cpanel_ready/assets', { recursive: true });
    }
    copyDirStructure('dist/assets', 'cpanel_ready/assets');
    fs.copyFileSync('dist/index.html', 'cpanel_ready/index.html');
    if (fs.existsSync('dist/.htaccess')) {
        let htaccess = fs.readFileSync('dist/.htaccess', 'utf8');
        htaccess = "RewriteEngine On\n\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule ^([a-zA-Z0-9-]+)/(server-[a-zA-Z0-9-]+)/?$ player.php?match=$1&server=$2 [QSA,L]\n\n" + htaccess;
        fs.writeFileSync('cpanel_ready/.htaccess', htaccess);
    }
    fs.copyFileSync('player.php', 'cpanel_ready/player.php');

    // Rewrite api routes for CPanel NGINX fallback
    const jsFiles = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js'));
    for (const file of jsFiles) {
        let content = fs.readFileSync(`dist/assets/${file}`, 'utf8');
        content = content.replace(/\/api\/matches/g, '/api.php?action=matches');
        content = content.replace(/\/api\/proxy\?url=/g, '/api.php?action=proxy&url=');
        content = content.replace(/\/api\/scrape/g, '/api.php?action=scrape');
        content = content.replace(/\/api\/match\.json/g, '/api.php?action=match.json');
        fs.writeFileSync(`cpanel_ready/assets/${file}`, content);
    }
    
    if (fs.existsSync('cpanel_ready_script/assets')) {
        fs.rmSync('cpanel_ready_script/assets', { recursive: true });
    }
    copyDirStructure('dist/assets', 'cpanel_ready_script/assets');
    fs.copyFileSync('dist/index.html', 'cpanel_ready_script/index.html');
    if (fs.existsSync('dist/.htaccess')) {
        let htaccess = fs.readFileSync('dist/.htaccess', 'utf8');
        htaccess = "RewriteEngine On\n\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule ^([a-zA-Z0-9-]+)/(server-[a-zA-Z0-9-]+)/?$ player.php?match=$1&server=$2 [QSA,L]\n\n" + htaccess;
        fs.writeFileSync('cpanel_ready_script/.htaccess', htaccess);
    }
    fs.copyFileSync('player.php', 'cpanel_ready_script/player.php');

    // Rewrite api routes for CPanel script NGINX fallback
    for (const file of jsFiles) {
        let content = fs.readFileSync(`dist/assets/${file}`, 'utf8');
        content = content.replace(/\/api\/matches/g, '/api.php?action=matches');
        content = content.replace(/\/api\/proxy\?url=/g, '/api.php?action=proxy&url=');
        content = content.replace(/\/api\/scrape/g, '/api.php?action=scrape');
        content = content.replace(/\/api\/match\.json/g, '/api.php?action=match.json');
        fs.writeFileSync(`cpanel_ready_script/assets/${file}`, content);
    }
    
    console.log("dist copied to cpanel_ready and cpanel_ready_script with rewritten API endpoints");
}
