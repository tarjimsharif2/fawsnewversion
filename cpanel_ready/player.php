<?php
error_reporting(0);
ini_set('display_errors', '0');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stream Player</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.7.1/shaka-player.ui.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.7.1/controls.min.css">
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        #video-container { width: 100%; height: 100%; position: relative; display: flex; align-items: center; justify-content: center; }
        video { width: 100%; height: 100%; max-height: 100%; object-fit: contain; }
        #watermark { position: absolute; top: 16px; right: 16px; z-index: 9999; pointer-events: none; }
        #watermark img { height: 60px; opacity: 0.85; filter: drop-shadow(0 2px 12px rgba(0,0,0,0.95)); }
        #loading { color: white; font-family: sans-serif; position: absolute; z-index: 10; font-size: 1.2rem; }
    </style>
</head>
<body>
    <div id="loading">Loading stream...</div>
    <div id="video-container" data-shaka-player-container>
        <video id="video" autoplay playsinline crossorigin="anonymous" data-shaka-player></video>
        <div id="watermark"><img src="https://i.ibb.co/Q3rp8ZXs/20260203-180035-0000.png" alt="Watermark"></div>
    </div>

    <script>
        const urlParams = new URLSearchParams(window.location.search);
        const matchSlug = urlParams.get('match');
        const serverSlug = urlParams.get('server');

        function createSlug(text) {
            if (!text) return '';
            return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        }

        function getMatchSlug(home, away) {
            return createSlug((home || 'unknown') + '-vs-' + (away || 'unknown'));
        }

        function getServerSlugs(servers) {
            const slugs = {};
            const nameCount = {};
            servers.forEach(s => {
                const name = s.name || s.title || 'server';
                let baseSlug = createSlug(name) || 'server';
                
                if (!nameCount[baseSlug]) {
                    nameCount[baseSlug] = 1;
                    slugs[s.id || s._id] = baseSlug;
                } else {
                    nameCount[baseSlug]++;
                    slugs[s.id || s._id] = baseSlug + '-' + nameCount[baseSlug];
                }
            });
            return slugs;
        }

        async function initPlayer() {
            try {
                const res = await fetch('/api.php?action=matches');
                const data = await res.json();
                
                if (!data || !data.matches) {
                    document.getElementById('loading').innerText = 'Failed to load match data.';
                    return;
                }

                const match = data.matches.find(m => getMatchSlug(m.homeTeam, m.awayTeam) === matchSlug);
                if (!match) {
                    document.getElementById('loading').innerText = 'Match not found.';
                    return;
                }

                const serverSlugs = getServerSlugs(match.servers);
                const server = match.servers.find(s => serverSlugs[s.id || s._id] === serverSlug);

                if (!server) {
                    document.getElementById('loading').innerText = 'Server not found.';
                    return;
                }

                let streamUrl = server.streamUrl || server.url;
                if (!streamUrl) {
                    document.getElementById('loading').innerText = 'Stream URL is empty.';
                    return;
                }

                let isIframe = server.type === 'iframe' || (!server.streamUrl && (streamUrl.includes('/embed') || streamUrl.endsWith('.html') || streamUrl.endsWith('.php') || streamUrl.includes('iframe=true')));
                
                const matchRutube = streamUrl.match(/(?:livestream|video)\/([a-zA-Z0-9_-]+)/);
                if (streamUrl.includes('rutube.ru') && matchRutube && matchRutube[1]) {
                    streamUrl = `https://rutube.ru/play/embed/${matchRutube[1]}?autoplay=1`;
                    isIframe = true;
                }

                if (isIframe) {
                    if (window.location.protocol === 'https:' && streamUrl.startsWith('http://')) {
                        document.getElementById('loading').innerText = 'Cannot load HTTP iframe on HTTPS site (Mixed Content).';
                        document.getElementById('loading').style.display = 'block';
                        return;
                    }
                    document.getElementById('video').remove();
                    const iframe = document.createElement('iframe');
                    iframe.src = streamUrl;
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    iframe.style.border = 'none';
                    iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
                    iframe.setAttribute('allowfullscreen', 'true');
                    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms allow-popups');
                    document.getElementById('video-container').appendChild(iframe);
                    document.getElementById('loading').style.display = 'none';
                    return;
                }

                const video = document.getElementById('video');

                shaka.polyfill.installAll();
                if (!shaka.Player.isBrowserSupported()) {
                    document.getElementById('loading').innerText = 'Browser not supported.';
                    document.getElementById('loading').style.display = 'block';
                    return;
                }

                // Wait for shaka UI to initialize
                const waitForUI = setInterval(async () => {
                    if (video.ui) {
                        clearInterval(waitForUI);
                        const ui = video.ui;
                        const controls = ui.getControls();
                        const player = controls.getPlayer();
                        
                        ui.configure({
                    controlPanelElements: [
                        "play_pause",
                        "time_and_duration",
                        "mute",
                        "volume",
                        "spacer",
                        "language",
                        "captions",
                        "picture_in_picture",
                        "quality",
                        "fullscreen",
                    ],
                    seekBarColors: {
                        base: "rgba(255, 255, 255, 0.3)",
                        buffered: "rgba(255, 255, 255, 0.5)",
                        played: "#ff3b30",
                    },
                });

                let playerConfig = {
                    streaming: {
                        lowLatencyMode: true,
                        bufferingGoal: 10,
                        rebufferingGoal: 2,
                        bufferBehind: 15,
                        stallEnabled: true,
                        stallThreshold: 1,
                        stallSkip: 0.5,
                        retryParameters: {
                            timeout: 10000,
                            maxAttempts: 5,
                            baseDelay: 300,
                            backoffFactor: 1.2,
                        },
                        ignoreTextStreamFailures: true,
                    },
                    manifest: {
                        dash: {
                            ignoreMinBufferTime: true,
                        },
                        retryParameters: {
                            timeout: 8000,
                            maxAttempts: 3,
                        },
                    },
                };
                
                if (server.drm || server.drmKey) {
                    let clearKeys = {};
                    let licenseServerUrl = null;
                    const drmStr = server.drm || server.drmKey;
                    
                    try {
                        if (typeof drmStr === 'string' && drmStr.includes('{')) {
                            const parsed = JSON.parse(drmStr);
                            if (parsed.keys) {
                                parsed.keys.forEach(k => {
                                    if (k.kid && k.k) clearKeys[k.kid] = k.k;
                                    else if (k.k_id && k.k_v) clearKeys[k.k_id] = k.k_v;
                                });
                            } else if (parsed.clearKeys) {
                                clearKeys = parsed.clearKeys;
                            }
                        } else if (typeof drmStr === 'string' && drmStr.includes(':') && !drmStr.includes('//')) {
                            const [kid, k] = drmStr.split(':');
                            if (kid && k) clearKeys[kid] = k;
                        } else if (typeof drmStr === 'string' && (drmStr.startsWith('http://') || drmStr.startsWith('https://'))) {
                            licenseServerUrl = drmStr;
                        } else if (Array.isArray(drmStr)) {
                            drmStr.forEach(k => {
                                if (k.keyId && k.key) clearKeys[k.keyId] = k.key;
                                else if (k.kid && k.key) clearKeys[k.kid] = k.key;
                            });
                        }
                    } catch (e) {
                        console.error("Failed to parse DRM config", e);
                    }
                    
                    if (Object.keys(clearKeys).length > 0) {
                        playerConfig.drm = {
                            clearKeys: clearKeys,
                            preferredKeySystems: ["org.w3.clearkey"],
                        };
                    } else if (licenseServerUrl) {
                        playerConfig.drm = {
                            servers: {
                                "com.widevine.alpha": licenseServerUrl,
                                "com.microsoft.playready": licenseServerUrl,
                            },
                        };
                    }
                }

                player.configure(playerConfig);

                player.getNetworkingEngine().registerRequestFilter((type, request) => {
                    if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) {
                        if (server.headers) {
                            for (const [key, value] of Object.entries(server.headers)) {
                                request.headers[key] = value;
                            }
                        }
                        return;
                    }

                    if (!request.uris || request.uris.length === 0) return;

                    request.uris = request.uris.map((originalUri) => {
                        if (originalUri.includes("/api.php?action=proxy") || originalUri.includes("/api/proxy")) {
                            return originalUri;
                        }
                        if (originalUri.startsWith("http://") || originalUri.startsWith("https://")) {
                            const proxyHeaders = { ...server.headers };
                            if (originalUri.includes("fawanews") || originalUri.includes("193.47")) {
                                proxyHeaders['Referer'] = 'http://www.fawanews.sc/';
                            }
                            const baseUrl = window.location.origin;
                            return `${baseUrl}/api.php?action=proxy&url=${encodeURIComponent(originalUri)}&headers=${encodeURIComponent(JSON.stringify(proxyHeaders))}`;
                        }
                        return originalUri;
                    });
                });

                player.addEventListener('error', (event) => {
                    console.error('Shaka Player Error:', event.detail);
                    document.getElementById('loading').innerText = 'Playback Error: ' + (event.detail && event.detail.message ? event.detail.message : 'Unknown error');
                    document.getElementById('loading').style.display = 'block';
                });

                try {
                    const isDash = streamUrl.includes('.mpd') || server.type === 'dash';
                    const isHls = streamUrl.includes('.m3u8') || server.type === 'm3u8' || server.type === 'hls' || (!isDash && !isIframe);
                    const mimeType = isDash ? 'application/dash+xml' : (isHls ? 'application/x-mpegURL' : undefined);
                    
                    await player.load(streamUrl, undefined, mimeType);
                    document.getElementById('loading').style.display = 'none';
                    
                    video.muted = true;
                    try {
                        const playPromise = video.play();
                        if (playPromise !== undefined) {
                            playPromise.then(() => {
                                video.muted = false;
                            }).catch(() => {
                                video.muted = true;
                                video.play().catch(e => console.log('Autoplay blocked completely', e));
                            });
                        }
                    } catch (e) {
                        console.log('Play catch', e);
                    }
                } catch (e) {
                    console.error('Error loading video', e);
                    document.getElementById('loading').innerText = 'Error loading video: ' + e.message;
                    document.getElementById('loading').style.display = 'block';
                }
                    }
                }, 100);

            } catch (err) {
                console.error(err);
                document.getElementById('loading').innerText = 'Error loading stream: ' + err.message;
            }
        }

        document.addEventListener('DOMContentLoaded', initPlayer);
    </script>
</body>
</html>
