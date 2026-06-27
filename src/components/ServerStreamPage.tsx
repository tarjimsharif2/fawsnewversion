import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Match, ServerLink } from '../types';
import { ShakaPlayer } from './ShakaPlayer';
import { getMatchSlug, getServerSlugs } from '../utils';

export default function ServerStreamPage({ data, loading }: { data: any, loading: boolean }) {
  const { matchSlug, serverSlug } = useParams<{ matchSlug: string, serverSlug: string }>();

  const [injectedStreamUrl, setInjectedStreamUrl] = React.useState<string | null>(null);
  const [injectedDrm, setInjectedDrm] = React.useState<any>(null);
  const [injectedType, setInjectedType] = React.useState<string | null>(null);

  useEffect(() => {
    const handleFullscreenChange = async () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (isFullscreen) {
        try {
          if (screen.orientation && (screen.orientation as any).lock) {
            await (screen.orientation as any).lock("landscape");
          }
        } catch (error) {
          console.warn("Orientation lock failed:", error);
        }
      } else {
        try {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
        } catch (error) {
          console.warn("Orientation unlock failed:", error);
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  
  // Find match from props data
  const matchesArray = Array.isArray(data?.matches) ? data.matches : [];
  const currentMatch = matchesArray.find((m: Match) => getMatchSlug(m.homeTeam, m.awayTeam) === matchSlug);
  const serverSlugs = currentMatch ? getServerSlugs(currentMatch.servers) : {};
  const currentActiveServer = currentMatch ? currentMatch.servers.find((s: ServerLink) => serverSlugs[s.id] === serverSlug) : null;

  // Lock in the match and server so that background polling failures don't disrupt the stream
  const [lockedMatch, setLockedMatch] = React.useState<Match | null>(null);
  const [lockedServer, setLockedServer] = React.useState<ServerLink | null>(null);

  useEffect(() => {
    if (currentMatch && !lockedMatch) {
      setLockedMatch(currentMatch);
    }
  }, [currentMatch, lockedMatch]);

  useEffect(() => {
    if (currentActiveServer && !lockedServer) {
      setLockedServer(currentActiveServer);
    }
  }, [currentActiveServer, lockedServer]);

  const match = lockedMatch || currentMatch;
  const activeServer = lockedServer || currentActiveServer;

  useEffect(() => {
    if (activeServer && !activeServer.streamUrl && activeServer.url?.includes('fawanews.sc')) {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      fetch(`${apiUrl}/api/proxy?url=${encodeURIComponent(activeServer.url)}`)
        .then(res => res.text())
        .then(html => {
          let streamUrl = '';
          if (html.includes('var videos =')) {
             const videoMatch = html.match(/var\s+videos\s*=\s*(\[.*?\])/s);
             if (videoMatch) {
                try {
                   const parsedVideos = JSON.parse(videoMatch[1].replace(/'/g, '"').replace(/,\s*\]/, ']'));
                   if (Array.isArray(parsedVideos) && parsedVideos.length > 0 && parsedVideos[0]) {
                      streamUrl = parsedVideos[0];
                   }
                } catch (e) {
                   console.error("Failed to parse videos array", e);
                }
             }
          }

          if (streamUrl) {
            // Found a stream. Now proxy the m3u8 and ts segments to avoid mixed content and CORS
            const customHeaders = JSON.stringify({ "Referer": "http://www.fawanews.sc/" });
            const proxiedM3u8Url = `${apiUrl}/api/proxy?url=${encodeURIComponent(streamUrl)}&headers=${encodeURIComponent(customHeaders)}`;
            setInjectedStreamUrl(proxiedM3u8Url);
            setInjectedType(streamUrl.includes('.mpd') ? 'dash' : 'm3u8');
            // Headers will be cleared in the render block for fawanews
          }
        })
        .catch(err => console.error("Client side extraction failed:", err));
    }
  }, [activeServer]);

  if (loading && !match) {
    return (
      <div className="min-h-[100dvh] w-full bg-black flex items-center justify-center overflow-hidden m-0 p-0 fixed inset-0 z-[9999]">
        <div className="w-full h-full bg-black flex items-center justify-center relative">
          <ShakaPlayer src="" type="m3u8" title="Loading..." headers={{}} drm={null} />
        </div>
      </div>
    );
  }

  if (!match) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Match Not Found</div>;
  }

  if (!activeServer) {
     return <div className="min-h-screen bg-black text-white flex items-center justify-center">Server Not Found</div>;
  }

  let finalStreamUrl = injectedStreamUrl || activeServer.streamUrl;
  let finalHeaders = activeServer.headers;
  
  if (finalStreamUrl && activeServer.url?.includes('fawanews.sc')) {
      finalHeaders = undefined; // Do not send referer via JS fetch directly to avoid CORS preflight, proxy handles it
      if (!injectedStreamUrl) {
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const customHeaders = JSON.stringify({ "Referer": "http://www.fawanews.sc/" });
          finalStreamUrl = `${apiUrl}/api/proxy?url=${encodeURIComponent(finalStreamUrl)}&headers=${encodeURIComponent(customHeaders)}`;
      }
  }

  let finalDrm = injectedDrm || (activeServer as any).drm || (activeServer as any).drmKey;
  let finalType = injectedType || activeServer.type;

  let checkUrl = finalStreamUrl || activeServer.externalUrl || activeServer.url || '';
  
  // Intercept Rutube URLs to embed them as iframe and prevent proxy bandwidth exhaustion (Vercel limits)
  if (checkUrl.includes('rutube.ru')) {
    const matchId = checkUrl.match(/(?:livestream|video)\/([a-zA-Z0-9_-]+)/);
    if (matchId && matchId[1]) {
       checkUrl = `https://rutube.ru/play/embed/${matchId[1]}?autoplay=1`;
    }
  }

  const isIframe = finalType === 'iframe' || 
                   (!finalStreamUrl && (
                     checkUrl.includes('/embed') || 
                     checkUrl.endsWith('.html') || 
                     checkUrl.endsWith('.php') || 
                     checkUrl.includes('iframe=true')
                   ));

  return (
    <div className="min-h-[100dvh] w-full bg-black flex items-center justify-center overflow-hidden m-0 p-0 fixed inset-0 z-[9999]">
      <div className="w-full h-full bg-black flex items-center justify-center relative">
         {isIframe ? (
            <>
               {finalType === 'iframe' && checkUrl.includes('#player') ? (
                  // Specifically format the iframe for fawanews to hide ads and top nav
                  <div className="w-full max-w-6xl mx-auto aspect-video relative overflow-hidden bg-black">
                      <iframe 
                        src={checkUrl} 
                        sandbox="allow-scripts allow-same-origin"
                        className="absolute w-full" 
                        style={{ top: '0', left: 0, height: '2200px', border: 'none' }}
                        allow="autoplay; fullscreen; picture-in-picture" 
                        allowFullScreen
                        scrolling="no"
                      />
                  </div>
               ) : (
                  <iframe 
                    src={checkUrl} 
                    sandbox={checkUrl.includes('fawanews') ? "allow-scripts allow-same-origin" : undefined}
                    className="w-full h-full border-0 absolute inset-0 bg-black" 
                    allow="autoplay; fullscreen; picture-in-picture" 
                    allowFullScreen
                  />
               )}
               {/* Watermark Logo for iframe streams */}
               <div className="absolute top-4 right-4 z-[9999] pointer-events-none">
                 <img 
                   src="https://i.ibb.co/Q3rp8ZXs/20260203-180035-0000.png" 
                   alt="Stream Watermark" 
                   className="h-10 sm:h-14 md:h-16 lg:h-20 w-auto object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] opacity-85"
                 />
               </div>
            </>
         ) : (
            <ShakaPlayer 
               src={checkUrl} 
               type={finalType}
               title={activeServer.name}
               headers={finalHeaders || {}}
               drm={finalDrm}
            />
         )}
      </div>
    </div>
  );
}
