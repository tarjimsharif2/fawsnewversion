<?php
$matchRes = 'var videos = ["http://193.47.62.41/hls/AYYYGd.m3u8"];';
if ($matchRes && preg_match('/var\s+videos\s*=\s*(\[.*?\])/s', $matchRes, $m)) {
    $jsonStr = str_replace("'", '"', $m[1]);
    $jsonStr = preg_replace('/,\s*\]/', ']', $jsonStr);
    $videos = json_decode($jsonStr, true);
    if (is_array($videos)) {
        echo "Servers extracted!";
        var_dump($videos);
    }
} else {
    echo "NO MATCH";
}
