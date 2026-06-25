<?php
error_reporting(0);
ini_set('display_errors', '0');
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$cacheFile = __DIR__ . '/cache.json';
$cacheTime = 60; // 60 seconds

function createSlug($text) {
    if (!$text) return '';
    $text = strtolower($text);
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    $text = trim($text, '-');
    return $text;
}

function getMatchSlug($home, $away) {
    $home = $home ?: 'unknown';
    $away = $away ?: 'unknown';
    return createSlug("$home-vs-$away");
}

function getServerSlugs($servers) {
    $slugs = [];
    $nameCount = [];
    foreach ($servers as $s) {
        $name = isset($s['name']) ? $s['name'] : (isset($s['title']) ? $s['title'] : 'server');
        $baseSlug = createSlug($name);
        if (!$baseSlug) $baseSlug = 'server';
        
        if (!isset($nameCount[$baseSlug])) {
            $nameCount[$baseSlug] = 1;
        } else {
            $nameCount[$baseSlug]++;
        }
        
        $id = isset($s['id']) ? $s['id'] : (isset($s['_id']) ? $s['_id'] : '');
        if ($nameCount[$baseSlug] === 1) {
            $slugs[$id] = $baseSlug;
        } else {
            $slugs[$id] = $baseSlug . '-' . $nameCount[$baseSlug];
        }
    }
    return $slugs;
}

function fetchMatches() {
    $url = 'http://www.fawanews.sc/';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if($httpCode == 200 && $response) {
        $matches = [];
        $dom = new DOMDocument();
        @$dom->loadHTML($response);
        $xpath = new DOMXPath($dom);
        
        $userItems = $xpath->query('//div[contains(@class, "user-item")]');
        $uniqueMatches = [];
        $matchesToProcess = [];
        
        foreach($userItems as $item) {
            $anchors = $xpath->query('.//a', $item);
            if ($anchors->length == 0) continue;
            
            $hrefRaw = $anchors->item(0)->getAttribute('href');
            if (empty($hrefRaw)) continue;
            
            $href = strpos($hrefRaw, 'http') === 0 ? $hrefRaw : "http://www.fawanews.sc/" . ltrim($hrefRaw, '/');
            if (strpos($href, '.html') === false) continue;
            
            $slug = str_replace('.html', '', $hrefRaw);
            if (isset($uniqueMatches[$slug])) continue;
            $uniqueMatches[$slug] = true;
            
            $nameNodes = $xpath->query('.//*[contains(@class, "user-item__name")]', $item);
            $playingNodes = $xpath->query('.//*[contains(@class, "user-item__playing")]', $item);
            $imgNodes = $xpath->query('.//img', $item);
            
            $title = $nameNodes->length > 0 ? trim($nameNodes->item(0)->textContent) : '';
            $playing = $playingNodes->length > 0 ? trim($playingNodes->item(0)->textContent) : '';
            $imgSrc = $imgNodes->length > 0 ? $imgNodes->item(0)->getAttribute('src') : '';
            
            if (!$title || !$playing) continue;

            $timeStr = '';
            if (preg_match('/\d{2}:\d{2}/', $playing, $m)) {
                $timeStr = $m[0];
            }
            
            $homeTeam = $title;
            $awayTeam = 'TBD';
            if (strpos($title, ' vs ') !== false) {
                $parts = explode(' vs ', $title);
                $homeTeam = trim($parts[0]);
                $awayTeam = trim($parts[1]);
            } else if (strpos($title, ' - ') !== false) {
                $parts = explode(' - ', $title, 2);
                $homeTeam = trim($parts[0]);
                $awayTeam = trim($parts[1]);
            }
            
            $serverSuffix = '';
            if (strpos($awayTeam, ' --- ') !== false) {
                $p = explode(' --- ', $awayTeam);
                $awayTeam = trim($p[0]);
                $serverSuffix = trim($p[1]);
            } else if (strpos($awayTeam, ' -- ') !== false) {
                $p = explode(' -- ', $awayTeam);
                $awayTeam = trim($p[0]);
                $serverSuffix = trim($p[1]);
            }
            
            $competition = trim(str_replace($timeStr, '', $playing));
            
            $isoTime = gmdate('Y-m-d\TH:i:s\Z');
            if ($timeStr) {
                $isoTime = gmdate('Y-m-d\T') . $timeStr . ':00Z';
            }

            $trueSlug = preg_replace('/[^a-z0-9]+/', '-', strtolower("$homeTeam-$awayTeam"));
            $trueSlug = trim($trueSlug, '-');

            if (!isset($matchesToProcess[$trueSlug])) {
                $matchesToProcess[$trueSlug] = [
                    'id' => $trueSlug,
                    'title' => "$homeTeam vs $awayTeam",
                    'shortTitle' => $title,
                    'slug' => $trueSlug,
                    'sport' => 'Football',
                    'competition' => $competition,
                    'time' => $isoTime,
                    'status' => 'Upcoming',
                    'isLive' => false,
                    'isPinned' => false,
                    'homeTeam' => $homeTeam,
                    'awayTeam' => $awayTeam,
                    'homeLogo' => $imgSrc,
                    'awayLogo' => $imgSrc,
                    'servers' => [],
                    'fawaLinks' => []
                ];
            }
            $matchesToProcess[$trueSlug]['fawaLinks'][] = ['href' => $href, 'suffix' => $serverSuffix];
        }

        $multiUrls = [];
        foreach ($matchesToProcess as $slug => $match) {
            foreach ($match['fawaLinks'] as $idx => $linkObj) {
                $multiUrls[] = [
                    'slug' => $slug,
                    'idx' => $idx,
                    'url' => $linkObj['href'],
                    'suffix' => $linkObj['suffix']
                ];
            }
        }

        $chunkSize = 5;
        $urlChunks = array_chunk($multiUrls, $chunkSize);

        foreach ($urlChunks as $chunk) {
            $mh = curl_multi_init();
            $chList = [];
            foreach ($chunk as $task) {
                $ch = curl_init(str_replace(' ', '%20', $task['url']));
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 30);
                curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer: http://www.fawanews.sc/'
                ]);
                curl_multi_add_handle($mh, $ch);
                $task['ch'] = $ch;
                $chList[] = $task;
            }

            $running = null;
            do {
                curl_multi_exec($mh, $running);
                if ($running) {
                    curl_multi_select($mh, 1);
                }
            } while ($running > 0);

            foreach ($chList as $task) {
                $ch = $task['ch'];
                $matchRes = curl_multi_getcontent($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                
                if ($httpCode == 200 && $matchRes) {
                    $streamUrl = '';
                    if (preg_match('/var\s+videos\s*=\s*(\[.*?\])/s', $matchRes, $m)) {
                        $jsonStr = str_replace("'", '"', $m[1]);
                        $jsonStr = preg_replace('/,\s*\]/', ']', $jsonStr);
                        $videos = json_decode($jsonStr, true);
                        if (is_array($videos) && count($videos) > 0) {
                            $streamUrl = $videos[0];
                        }
                    }
                    if (empty($streamUrl) && preg_match('/<iframe[^>]+src=["\']([^"\']+)["\']/i', $matchRes, $m)) {
                        $streamUrl = $m[1];
                    }
                    
                    if ($streamUrl) {
                        $isDash = strpos($streamUrl, '.mpd') !== false;
                        $isIframe = !empty($streamUrl) && (strpos($streamUrl, '/embed') !== false || substr($streamUrl, -5) === '.html' || substr($streamUrl, -4) === '.php');
                        $suffixLabel = $task['suffix'] ? " ({$task['suffix']})" : '';
                        
                        $matchesToProcess[$task['slug']]['extractedServers'][] = [
                            'name' => "Stream" . $suffixLabel,
                            'url' => $task['url'],
                            'streamUrl' => $streamUrl,
                            'externalUrl' => '',
                            'type' => $isIframe ? 'iframe' : ($isDash ? 'dash' : 'm3u8'),
                            'quality' => 'Auto',
                            'headers' => ['Referer' => 'http://www.fawanews.sc/'],
                            'drm' => null,
                            'drmKey' => null,
                            'isWorking' => true
                        ];
                    }
                }
                curl_multi_remove_handle($mh, $ch);
                curl_close($ch);
            }
            curl_multi_close($mh);
        }

        $uniqueMatches = [];
        foreach ($matchesToProcess as $slug => $match) {
            $servers = [];
            $serverCount = 1;
            $extracted = isset($match['extractedServers']) ? $match['extractedServers'] : [];
            $fawaLinks = isset($match['fawaLinks']) ? $match['fawaLinks'] : [];
            
            $extractedMap = [];
            foreach ($extracted as $ext) {
                $extractedMap[$ext['url']] = $ext;
            }

            $uniqueStreamUrls = [];
            foreach ($fawaLinks as $linkIdx => $fawaLink) {
                $url = $fawaLink['href'];
                $ext = isset($extractedMap[$url]) ? $extractedMap[$url] : null;
                
                $streamUrl = $ext ? $ext['streamUrl'] : '';
                $type = $ext ? $ext['type'] : 'm3u8';
                $name = "Stream $serverCount";
                if ($fawaLink['suffix']) {
                    $name .= " (" . $fawaLink['suffix'] . ")";
                }

                $checkUrl = !empty($streamUrl) ? $streamUrl : (!empty($url) ? $url : '');
                if ($checkUrl && isset($uniqueStreamUrls[$checkUrl])) {
                    continue;
                }
                if ($checkUrl) {
                    $uniqueStreamUrls[$checkUrl] = true;
                }
                
                $server = [
                    'id' => preg_replace('/[^a-zA-Z0-9]/', '-', "$slug-stream-$serverCount"),
                    'name' => $name,
                    'url' => $url,
                    'streamUrl' => $streamUrl,
                    'externalUrl' => '',
                    'type' => $type,
                    'quality' => 'Auto',
                    'headers' => ['Referer' => 'http://www.fawanews.sc/'],
                    'drm' => null,
                    'drmKey' => null,
                    'isWorking' => true
                ];
                
                $servers[] = $server;
                $serverCount++;
            }
            $match['servers'] = $servers;
            unset($match['fawaLinks']);
            unset($match['extractedServers']);
            $uniqueMatches[] = $match;
        }
        
        return $uniqueMatches;
    }
    return null;
}

// Ensure cache exists
$memoryCache = null;
if (!file_exists($cacheFile) || (time() - filemtime($cacheFile)) >= $cacheTime) {
    if (file_exists($cacheFile)) touch($cacheFile); // Prevent cache stampede
    $data = fetchMatches();
    if ($data) {
        $cacheData = [
            'lastScraped' => date('Y-m-d\TH:i:s\Z'),
            'matches' => $data,
            'error' => null
        ];
        @file_put_contents($cacheFile, json_encode($cacheData));
        $memoryCache = $cacheData;
    }
}

$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$isMatchJson = strpos($requestUri, 'match.json') !== false;

$isProxy = (isset($_GET['action']) && $_GET['action'] == 'proxy') || strpos($requestUri, 'proxy') !== false;

if ($isProxy) {
    if (!isset($_GET['url'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing url parameter']);
        exit;
    }
    
    // Handle CORS preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
        header("Access-Control-Allow-Headers: *");
        header("Access-Control-Max-Age: 86400");
        exit;
    }

    $targetUrl = $_GET['url'];
    $headers = [];
    if (isset($_GET['headers'])) {
        $decodedHeaders = json_decode($_GET['headers'], true);
        if ($decodedHeaders && is_array($decodedHeaders)) {
            foreach($decodedHeaders as $k => $v) {
                $headers[] = "$k: $v";
            }
        }
    }
    if (empty($headers)) {
        $headers[] = "Referer: http://www.fawanews.sc/";
    }
    
    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $isMpeg = strpos($targetUrl, '.m3u8') !== false || strpos($targetUrl, '.mpd') !== false;

    // Pass along HTTP headers for streams (Content-Type etc)
    curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) use ($targetUrl, $isMpeg) {
        $len = strlen($header);
        $headerParts = explode(':', $header, 2);
        if (count($headerParts) < 2) return $len;
        
        $name = strtolower(trim($headerParts[0]));
        $value = trim($headerParts[1]);
        if (in_array($name, ['content-type', 'cache-control', 'expires', 'last-modified', 'etag', 'accept-ranges'])) {
             header($name . ': ' . $value);
        }
        return $len;
    });

    if (!$isMpeg) {
        // Stream directly to memory buffer for .ts / .mp4 segments to drastically save memory
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
        $headersSentFlag = false;
        curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $chunk) use (&$headersSentFlag) {
            if (!$headersSentFlag) {
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                http_response_code($httpCode);
                header("Access-Control-Allow-Origin: *");
                $headersSentFlag = true;
            }
            echo $chunk;
            ob_flush();
            flush(); 
            return strlen($chunk);
        });
        curl_exec($ch);
        curl_close($ch);
        exit;
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    http_response_code($httpCode);
    header("Access-Control-Allow-Origin: *");
    
    if ($isMpeg || strpos($response, '#EXTM3U') !== false) {
        $baseUrl = substr($targetUrl, 0, strrpos($targetUrl, '/') + 1);
        $parsedUrl = parse_url($targetUrl);
        $rootUrl = $parsedUrl['scheme'] . "://" . $parsedUrl['host'];
        if (isset($parsedUrl['port'])) {
           $rootUrl .= ":" . $parsedUrl['port'];
        }
        
        $lines = explode("\n", $response);
        $rewritten = [];
        
        $myProxyBase = "/api.php?action=proxy&url=";
        if (strpos($requestUri, '/api/proxy') !== false) {
             $myProxyBase = "/api/proxy?url=";
        }
        $headerP = isset($_GET['headers']) ? "&headers=" . urlencode($_GET['headers']) : "";

        foreach($lines as $line) {
            $t = trim($line);
            if (empty($t)) {
                $rewritten[] = $line;
                continue;
            }
            if (strpos($t, '#') === 0) {
                 // Rewrite URI inside #EXT-X tags
                 if (preg_match('/URI="(.*?)"/', $t, $m)) {
                      $uri = $m[1];
                      if (strpos($uri, 'http') === 0) {
                          $rewritten[] = $line;
                      } else if (strpos($uri, '/') === 0) {
                          $rewritten[] = preg_replace('/URI="(.*?)"/', 'URI="' . $rootUrl . $uri . '"', $line);
                      } else {
                          $rewritten[] = preg_replace('/URI="(.*?)"/', 'URI="' . $baseUrl . $uri . '"', $line);
                      }
                 } else {
                      $rewritten[] = $line;
                 }
            } else if (strpos($t, 'http') === 0) {
                 $rewritten[] = $line;
            } else if (strpos($t, '/') === 0) {
                 $rewritten[] = $rootUrl . $t;
            } else {
                 $rewritten[] = $baseUrl . $t;
            }
        }
        $response = implode("\n", $rewritten);
    }
    
    echo $response;
    exit;
}

$isScrape = (isset($_GET['action']) && $_GET['action'] == 'scrape') || strpos($requestUri, 'scrape') !== false;

if ($isScrape) {
    if ($memoryCache) {
        echo json_encode(['success' => true]);
    } else {
        $data = fetchMatches();
        if ($data) {
            $cacheData = [
                'lastScraped' => date('Y-m-d\TH:i:s\Z'),
                'matches' => $data,
                'error' => null
            ];
            file_put_contents($cacheFile, json_encode($cacheData));
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to fetch matches']);
        }
    }
    exit;
}

$cached = file_exists($cacheFile) ? json_decode(file_get_contents($cacheFile), true) : null;
if (!$cached && $memoryCache) {
    $cached = $memoryCache;
}

if (!$cached) {
    echo json_encode(['error' => 'No data available']);
    exit;
}

if ($isMatchJson) {
    $formattedMatches = [];
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'tv.photocard.fun';
    $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || 
                (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ? "https" : "http";
    $baseUrl = "$protocol://$host";
    
    foreach ($cached['matches'] as $match) {
        $reactMatchSlug = getMatchSlug(isset($match['homeTeam']) ? $match['homeTeam'] : '', isset($match['awayTeam']) ? $match['awayTeam'] : '');
        $reactServerSlugs = getServerSlugs($match['servers']);
        
        $workingServers = array_filter($match['servers'], function($s) {
            return isset($s['isWorking']) && $s['isWorking'] === true;
        });
        
        $workingServers = array_values($workingServers);
        
        foreach ($workingServers as $index => $server) {
            $streamUrl = !empty($server['streamUrl']) ? $server['streamUrl'] : (!empty($server['url']) ? $server['url'] : '');
            
            $serverId = isset($server['id']) && isset($reactServerSlugs[$server['id']]) ? $reactServerSlugs[$server['id']] : "server-" . ($index + 1);
            $matchId = $index === 0 ? "{$reactMatchSlug}.html" : "{$reactMatchSlug}_{$index}.html";
            $suffix = count($match['servers']) > 1 ? " --- S" . ($index + 1) : "";
            
            $timeStr = "TBA";
            if (!empty($match['time'])) {
                $timeParts = strtotime(date('Y-m-d') . ' ' . $match['time']);
                if ($timeParts) {
                    $timeStr = date('h:i A', $timeParts);
                } else {
                    $timeStr = $match['time'];
                }
            }
            
            $teamA = isset($match['homeTeam']) && $match['homeTeam'] !== 'Team A' ? $match['homeTeam'] : '';
            $teamB = isset($match['awayTeam']) && $match['awayTeam'] !== 'Team B' ? $match['awayTeam'] : '';
            
            $formattedName = $match['title'];
            if ($teamA && $teamB && $teamA !== $teamB && $teamB !== 'TBD') {
                $formattedName = $teamA . ' vs ' . $teamB;
            }
            
            $formattedMatches[] = [
                'id' => $matchId,
                'name' => $formattedName . $suffix,
                'league' => !empty($match['competition']) ? $match['competition'] : "Live Sports",
                'time' => $timeStr,
                'image' => !empty($match['homeLogo']) ? $match['homeLogo'] : "https://pbs.twimg.com/profile_images/1747638026832887808/ZCUr0JDi_400x400.jpg",
                'matchUrl' => "http://www.fawanews.sc/{$reactMatchSlug}.html",
                'playerUrl' => "{$baseUrl}/{$reactMatchSlug}/{$serverId}", // No hash routing here 
                'streamUrl' => $streamUrl,
                'serverName' => trim(preg_replace('/\s*(-|\|)?\s*Server\s*\d+/i', '', isset($server['name']) && $server['name'] ? $server['name'] : (isset($server['title']) && $server['title'] ? $server['title'] : 'Unknown Server'))) ?: 'Unknown Server'
            ];
        }
    }
    
    echo json_encode([
        'updatedAt' => $cached['lastScraped'] ?? date('Y-m-d\TH:i:s\Z'),
        'count' => count($formattedMatches),
        'matches' => $formattedMatches
    ], JSON_UNESCAPED_SLASHES);

} else {
    // Regular /api/matches output
    echo json_encode($cached);
}

