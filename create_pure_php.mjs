import fs from 'fs';
import { execSync } from 'child_process';

const indexPhp = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ePlayHD - Live Sports</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { background-color: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
        .loader { border: 3px solid #334155; border-top-color: #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="min-h-screen flex flex-col bg-gray-900">
    <header class="bg-gray-800 p-4 shadow-md sticky top-0 z-50 border-b border-gray-700">
        <div class="max-w-6xl mx-auto flex justify-between items-center">
            <a href="index.php" class="text-2xl font-bold text-red-500 flex items-center gap-2">
                <i class="fas fa-play-circle"></i> ePlayHD
            </a>
            <div class="flex gap-2 relative">
                <input type="text" id="searchInput" placeholder="Search matches..." class="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-48 md:w-64 border border-gray-600">
            </div>
        </div>
    </header>

    <main class="flex-1 max-w-6xl mx-auto w-full p-4">
        <div class="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide" id="categoryFilter">
            <button class="filter-btn bg-red-600 text-white px-5 py-1.5 rounded-full font-medium whitespace-nowrap active" data-filter="All">All</button>
            <button class="filter-btn bg-gray-800 border border-gray-700 text-white px-5 py-1.5 rounded-full font-medium whitespace-nowrap hover:bg-gray-700" data-filter="Football">Football</button>
            <button class="filter-btn bg-gray-800 border border-gray-700 text-white px-5 py-1.5 rounded-full font-medium whitespace-nowrap hover:bg-gray-700" data-filter="Cricket">Cricket</button>
        </div>

        <div id="loading" class="flex flex-col items-center justify-center py-20">
            <div class="loader mb-4"></div>
            <p class="text-gray-400 font-medium">Loading matches...</p>
        </div>

        <div id="error" class="hidden text-center py-10 text-red-400">
            <p id="errorMsg"></p>
            <button onclick="fetchMatches()" class="mt-4 bg-red-600 px-6 py-2 rounded-lg font-medium hover:bg-red-700 text-white shadow-lg">Retry Connection</button>
        </div>

        <div id="matchesGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 hidden">
        </div>
    </main>

    <script>
        let allMatches = [];
        let currentFilter = 'All';

        async function fetchMatches() {
            document.getElementById('loading').classList.remove('hidden');
            document.getElementById('error').classList.add('hidden');
            document.getElementById('matchesGrid').classList.add('hidden');

            try {
                const response = await fetch('api.php?action=matches');
                if (!response.ok) throw new Error('Failed to load matches from server');
                const data = await response.json();
                
                if (data.matches) {
                    allMatches = data.matches;
                    renderMatches();
                } else {
                    throw new Error('Invalid data format received');
                }
            } catch (err) {
                document.getElementById('loading').classList.add('hidden');
                document.getElementById('error').classList.remove('hidden');
                document.getElementById('errorMsg').innerText = err.message;
            }
        }

        function renderMatches() {
            document.getElementById('loading').classList.add('hidden');
            const grid = document.getElementById('matchesGrid');
            grid.innerHTML = '';
            grid.classList.remove('hidden');

            const searchQuery = document.getElementById('searchInput').value.toLowerCase();

            const filtered = allMatches.filter(m => {
                const matchCat = (m.sport || '').toLowerCase() === currentFilter.toLowerCase();
                const isCatMatch = currentFilter === 'All' || matchCat;
                const isSearchMatch = m.title.toLowerCase().includes(searchQuery) || 
                                      m.homeTeam.toLowerCase().includes(searchQuery) || 
                                      m.awayTeam.toLowerCase().includes(searchQuery);
                return isCatMatch && isSearchMatch;
            });

            if (filtered.length === 0) {
                grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400 bg-gray-800 rounded-xl border border-gray-700">No matches found matching your criteria.</div>';
                return;
            }

            filtered.forEach(m => {
                const time = new Date(m.time).toLocaleString([], {hour: '2-digit', minute:'2-digit', month:'short', day:'numeric'});
                const card = document.createElement('a');
                card.href = 'player.php?id=' + m.slug;
                card.className = 'bg-gray-800 rounded-xl p-5 hover:bg-gray-750 transition border border-gray-700 hover:border-red-500 block relative overflow-hidden group shadow-lg';
                card.innerHTML = \`
                    <div class="flex justify-between items-center mb-4 text-xs text-gray-400 font-semibold">
                        <span class="bg-gray-700 px-2 py-1 rounded-md text-white shadow-sm border border-gray-600">\${m.competition || m.sport || 'Sports'}</span>
                        <span class="\${m.isLive ? 'text-red-500 animate-pulse font-bold' : 'text-gray-400'}">
                            \${m.isLive ? '• LIVE NOW' : time}
                        </span>
                    </div>
                    <div class="flex items-center justify-between mt-4">
                        <div class="flex flex-col items-center w-2/5">
                            <img src="\${m.homeLogo || 'https://via.placeholder.com/50'}" class="w-14 h-14 object-contain mb-3 bg-white rounded-full p-1 shadow-md" onerror="this.src='https://via.placeholder.com/50'">
                            <span class="text-center font-bold text-sm truncate w-full group-hover:text-red-400 transition">\${m.homeTeam}</span>
                        </div>
                        <div class="w-1/5 text-center text-gray-500 font-black text-sm bg-gray-900 rounded-full py-1">VS</div>
                        <div class="flex flex-col items-center w-2/5">
                            <img src="\${m.awayLogo || 'https://via.placeholder.com/50'}" class="w-14 h-14 object-contain mb-3 bg-white rounded-full p-1 shadow-md" onerror="this.src='https://via.placeholder.com/50'">
                            <span class="text-center font-bold text-sm truncate w-full group-hover:text-red-400 transition">\${m.awayTeam}</span>
                        </div>
                    </div>
                \`;
                grid.appendChild(card);
            });
        }

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('bg-red-600', 'active', 'border-transparent');
                    b.classList.add('bg-gray-800', 'border-gray-700');
                });
                e.target.classList.remove('bg-gray-800', 'border-gray-700');
                e.target.classList.add('bg-red-600', 'active', 'border-transparent');
                currentFilter = e.target.getAttribute('data-filter');
                renderMatches();
            });
        });

        document.getElementById('searchInput').addEventListener('input', renderMatches);

        // Init
        fetchMatches();
    </script>
</body>
</html>`;

const playerPhp = `<?php
$slug = $_GET['id'] ?? '';
$serverIdx = isset($_GET['server']) ? (int)$_GET['server'] : 0;
if (!$slug) {
    header("Location: index.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Watch Live - ePlayHD</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- HLS.js for m3u8 -->
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <!-- Shaka Player for DASH -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.3.5/shaka-player.ui.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.3.5/controls.min.css">
    
    <style>
        body { background-color: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; margin:0; }
        .loader { border: 3px solid #334155; border-top-color: #ef4444; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        #videoContainer { position: relative; width: 100%; padding-top: 56.25%; background: #000; overflow: hidden; }
        #videoElement, iframe.video-iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
        .server-btn.active { border-color: #ef4444; background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
        
        /* Custom Scrollbar for Servers */
        #serversList::-webkit-scrollbar { height: 6px; }
        #serversList::-webkit-scrollbar-track { background: #1e293b; border-radius: 4px; }
        #serversList::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
        #serversList::-webkit-scrollbar-thumb:hover { background: #64748b; }
    </style>
</head>
<body class="min-h-screen flex flex-col bg-gray-900">
    <header class="bg-gray-800 p-4 shadow-md sticky top-0 z-50 flex items-center gap-4 border-b border-gray-700">
        <a href="index.php" class="text-gray-400 hover:text-white transition bg-gray-700 p-2 rounded-full w-10 h-10 flex items-center justify-center">
            <i class="fas fa-arrow-left"></i>
        </a>
        <h1 id="matchTitle" class="text-xl font-bold text-white truncate flex-1">Loading...</h1>
    </header>

    <main class="flex-1 flex flex-col lg:flex-row w-full bg-black lg:bg-gray-900">
        <!-- Player Section -->
        <div class="flex-1 lg:w-3/4 flex flex-col">
            <div id="playerWrapper" class="w-full bg-black relative shadow-2xl">
                <div id="loadingPlayer" class="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black bg-opacity-90 hidden">
                    <div class="loader mb-4"></div>
                    <div class="text-gray-400 font-medium">Connecting to stream...</div>
                </div>
                <div id="videoContainer">
                    <!-- Player or Iframe injected here -->
                </div>
                <!-- Watermark -->
                <div class="absolute top-4 right-4 z-[9999] pointer-events-none opacity-85">
                    <img src="https://i.ibb.co/Q3rp8ZXs/20260203-180035-0000.png" alt="Watermark" class="h-10 sm:h-14 md:h-16 object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
                </div>
            </div>
            
            <div class="p-4 lg:p-6 bg-gray-900 border-b lg:border-b-0 lg:border-r border-gray-800">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-server text-red-500"></i> Available Servers
                    </h2>
                    <span id="serverCountBadge" class="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded border border-gray-700">0 Servers</span>
                </div>
                <div id="serversList" class="flex overflow-x-auto pb-3 gap-3">
                    <!-- Servers injected here -->
                </div>
            </div>
        </div>
        
        <!-- Match Info Section -->
        <div class="w-full lg:w-1/4 p-4 lg:p-6 bg-gray-900 border-l border-gray-800">
            <div class="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg sticky top-24" id="matchInfo">
                <div class="text-center text-xs font-bold tracking-widest text-gray-400 uppercase mb-4" id="matchComp">Competition</div>
                <div class="flex flex-col items-center justify-center mt-2 gap-4">
                    <div class="flex flex-col items-center w-full">
                        <img id="homeLogo" src="" class="w-20 h-20 object-contain mb-3 bg-white rounded-full p-2 shadow-md hidden">
                        <span id="homeTeam" class="text-center font-bold text-lg w-full">Team 1</span>
                    </div>
                    <div class="w-full text-center">
                        <span class="bg-gray-900 text-gray-500 font-black text-sm px-4 py-1 rounded-full border border-gray-700">VS</span>
                    </div>
                    <div class="flex flex-col items-center w-full">
                        <img id="awayLogo" src="" class="w-20 h-20 object-contain mb-3 bg-white rounded-full p-2 shadow-md hidden">
                        <span id="awayTeam" class="text-center font-bold text-lg w-full">Team 2</span>
                    </div>
                </div>
                <div class="text-center mt-8 pt-6 border-t border-gray-700">
                    <span id="matchStatus" class="inline-block px-4 py-2 rounded-full text-sm font-bold bg-gray-700 text-gray-300 shadow-inner">Upcoming</span>
                </div>
            </div>
        </div>
    </main>

    <script>
        const slug = "<?php echo htmlspecialchars($slug); ?>";
        let currentServerIdx = <?php echo $serverIdx; ?>;
        let matchData = null;
        let shakaApp = null;
        let hls = null;

        async function init() {
            try {
                const response = await fetch('api.php?action=matches');
                const data = await response.json();
                if(data.matches) {
                    matchData = data.matches.find(m => m.slug === slug);
                    if(matchData) {
                        renderMatchInfo();
                        renderServers();
                        playServer(currentServerIdx);
                    } else {
                        alert("Match not found or has ended.");
                        window.location.href = 'index.php';
                    }
                }
            } catch(e) {
                console.error("Error loading match", e);
            }
        }

        function renderMatchInfo() {
            document.title = \`\${matchData.title} - ePlayHD\`;
            document.getElementById('matchTitle').innerText = matchData.title;
            document.getElementById('matchComp').innerText = matchData.competition || matchData.sport;
            document.getElementById('homeTeam').innerText = matchData.homeTeam;
            document.getElementById('awayTeam').innerText = matchData.awayTeam;
            
            if(matchData.homeLogo) {
                document.getElementById('homeLogo').src = matchData.homeLogo;
                document.getElementById('homeLogo').classList.remove('hidden');
            }
            if(matchData.awayLogo) {
                document.getElementById('awayLogo').src = matchData.awayLogo;
                document.getElementById('awayLogo').classList.remove('hidden');
            }

            const statusEl = document.getElementById('matchStatus');
            if(matchData.isLive) {
                statusEl.innerText = "• LIVE NOW";
                statusEl.className = "inline-block px-4 py-2 rounded-full text-sm font-bold bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]";
            } else {
                const time = new Date(matchData.time).toLocaleString([], {hour: '2-digit', minute:'2-digit', month:'short', day:'numeric'});
                statusEl.innerText = time;
            }
        }

        function renderServers() {
            const container = document.getElementById('serversList');
            container.innerHTML = '';
            
            if(!matchData.servers || matchData.servers.length === 0) {
                container.innerHTML = '<span class="text-gray-500 py-2">No servers available yet. Check back closer to kickoff.</span>';
                document.getElementById('serverCountBadge').innerText = '0 Servers';
                return;
            }

            document.getElementById('serverCountBadge').innerText = \`\${matchData.servers.length} Servers\`;

            matchData.servers.forEach((s, idx) => {
                const btn = document.createElement('button');
                btn.className = \`server-btn flex-shrink-0 px-5 py-3 rounded-lg border border-gray-700 bg-gray-800 text-sm font-bold hover:border-red-500 hover:bg-gray-750 transition whitespace-nowrap \${idx === currentServerIdx ? 'active shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''}\`;
                
                let icon = 'fa-play';
                if(s.type === 'iframe') icon = 'fa-window-maximize';
                else if(s.name.toLowerCase().includes('hd')) icon = 'fa-tv';
                
                btn.innerHTML = \`<i class="fas \${icon} mr-2 opacity-70"></i> \${s.name || 'Server ' + (idx + 1)}\`;
                btn.onclick = () => playServer(idx);
                container.appendChild(btn);
            });
        }

        function destroyPlayers() {
            if(hls) {
                hls.destroy();
                hls = null;
            }
            if(shakaApp) {
                shakaApp.destroy();
                shakaApp = null;
            }
            document.getElementById('videoContainer').innerHTML = '';
        }

        async function playServer(idx) {
            if(!matchData.servers || !matchData.servers[idx]) return;
            currentServerIdx = idx;
            
            // Show loading
            document.getElementById('loadingPlayer').classList.remove('hidden');

            // Update buttons
            document.querySelectorAll('.server-btn').forEach((b, i) => {
                if(i === idx) b.classList.add('active', 'shadow-[0_0_10px_rgba(239,68,68,0.2)]');
                else b.classList.remove('active', 'shadow-[0_0_10px_rgba(239,68,68,0.2)]');
            });

            // Update URL without reload
            window.history.replaceState({}, '', \`player.php?id=\${slug}&server=\${idx}\`);

            const server = matchData.servers[idx];
            destroyPlayers();
            
            let streamUrl = server.streamUrl || server.url;
            const isIframe = server.type === 'iframe' || streamUrl.includes('embed') || streamUrl.endsWith('.html') || streamUrl.endsWith('.php');

            if(streamUrl.includes('rutube.ru')) {
                const rutubeMatch = streamUrl.match(/(?:livestream|video)\/([a-zA-Z0-9_-]+)/);
                if (rutubeMatch && rutubeMatch[1]) {
                    streamUrl = \`https://rutube.ru/play/embed/\${rutubeMatch[1]}?autoplay=1\`;
                }
            }

            if (isIframe) {
                const iframe = document.createElement('iframe');
                iframe.src = streamUrl;
                iframe.className = "video-iframe";
                iframe.allowFullscreen = true;
                iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
                
                // Special fawanews iframe logic to hide overflow
                if(streamUrl.includes('#player')) {
                    iframe.style.top = "0";
                    iframe.style.left = "0";
                    iframe.style.height = "2200px";
                    iframe.sandbox = "allow-scripts allow-same-origin";
                } else if(streamUrl.includes('fawanews')) {
                    iframe.sandbox = "allow-scripts allow-same-origin";
                }

                iframe.onload = () => {
                    document.getElementById('loadingPlayer').classList.add('hidden');
                };

                document.getElementById('videoContainer').appendChild(iframe);
            } else {
                const video = document.createElement('video');
                video.id = "videoElement";
                video.controls = true;
                video.autoplay = true;
                video.className = "w-full h-full object-contain";
                video.setAttribute('playsinline', '');
                document.getElementById('videoContainer').appendChild(video);

                video.addEventListener('playing', () => {
                    document.getElementById('loadingPlayer').classList.add('hidden');
                });
                video.addEventListener('error', () => {
                    document.getElementById('loadingPlayer').classList.add('hidden');
                    console.log("Error loading this stream. Please try another server.");
                });

                if(server.type === 'dash' || streamUrl.includes('.mpd')) {
                    // Init Shaka Player
                    shaka.polyfill.installAll();
                    if (shaka.Player.isBrowserSupported()) {
                        shakaApp = new shaka.Player(video);
                        if(server.drm && server.drmKey) {
                            shakaApp.configure({
                                drm: {
                                    clearKeys: {
                                        [server.drm]: server.drmKey
                                    }
                                }
                            });
                        }
                        try {
                            await shakaApp.load(streamUrl);
                            video.play().catch(e => console.log("Autoplay prevented"));
                        } catch (e) {
                            console.error('Error loading dash', e);
                            document.getElementById('loadingPlayer').classList.add('hidden');
                        }
                    } else {
                        console.error('Browser not supported for DASH');
                        document.getElementById('loadingPlayer').classList.add('hidden');
                    }
                } else {
                    // Init HLS.js
                    if(Hls.isSupported()) {
                        hls = new Hls({
                            debug: false,
                            enableWorker: true
                        });
                        hls.loadSource(streamUrl);
                        hls.attachMedia(video);
                        hls.on(Hls.Events.MANIFEST_PARSED, () => {
                            video.play().catch(e => console.log("Autoplay prevented"));
                        });
                        hls.on(Hls.Events.ERROR, function (event, data) {
                            if (data.fatal) {
                                switch (data.type) {
                                    case Hls.ErrorTypes.NETWORK_ERROR:
                                        hls.startLoad();
                                        break;
                                    case Hls.ErrorTypes.MEDIA_ERROR:
                                        hls.recoverMediaError();
                                        break;
                                    default:
                                        hls.destroy();
                                        document.getElementById('loadingPlayer').classList.add('hidden');
                                        break;
                                }
                            }
                        });
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = streamUrl;
                        video.addEventListener('loadedmetadata', () => {
                            video.play().catch(e => console.log("Autoplay prevented"));
                        });
                    } else {
                        video.src = streamUrl;
                    }
                }
            }
        }

        // Start
        init();
    </script>
</body>
</html>`;

fs.mkdirSync('pure_php_project', { recursive: true });
fs.copyFileSync('cpanel_ready/api.php', 'pure_php_project/api.php');
fs.writeFileSync('pure_php_project/index.php', indexPhp);
fs.writeFileSync('pure_php_project/player.php', playerPhp);

execSync('npx -y bestzip pure_php_project.zip pure_php_project/*');
console.log('pure_php_project.zip created successfully!');
