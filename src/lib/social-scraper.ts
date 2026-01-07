
// If JSDOM is not available, we use regex.

export async function fetchSocialStats(url: string, platform: string): Promise<{ views: number | null, error?: string }> {
    try {
        if (platform === 'YOUTUBE') {
            return await fetchYouTubeStats(url);
        } else if (platform === 'TIKTOK') {
            return await fetchTikTokStats(url);
        } else if (platform === 'FACEBOOK') {
            return await fetchFacebookStats(url);
        } else {
            return { views: null, error: 'Platform not supported for scraping' };
        }
    } catch (error) {
        console.error(`Error fetching stats for ${url}:`, error);
        return { views: null, error: 'Failed to fetch' };
    }
}

async function fetchYouTubeStats(url: string) {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!res.ok) return { views: null, error: `HTTP ${res.status}` };

        const text = await res.text();

        // Strategy 1: Look for interactionCount
        const interactionMatch = text.match(/<meta itemprop="interactionCount" content="(\d+)"/);
        if (interactionMatch) return { views: parseInt(interactionMatch[1]) };

        // Strategy 2: Look for viewCount in JSON payload
        const viewCountMatch = text.match(/"viewCount":"(\d+)"/);
        if (viewCountMatch) return { views: parseInt(viewCountMatch[1]) };

        // Strategy 3: "x views" pattern (less reliable)
        const simpleMatch = text.match(/(\d{1,3}(,\d{3})*)\s+views/);
        if (simpleMatch) return { views: parseInt(simpleMatch[1].replace(/,/g, '')) };

        return { views: null, error: 'Could not parse views' };
    } catch (e) {
        return { views: null, error: (e as Error).message };
    }
}

async function fetchTikTokStats(url: string) {
    try {
        // TikTok is hard. We'll try a basic fetch but likely get blocked.
        // We can try to use their oembed endpoint?
        // https://www.tiktok.com/oembed?url=...
        // Note: Oembed usually doesn't return view counts, just author/title.
        // Let's try scraping the page source for "playCount" or similar.

        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
                'Referer': 'https://www.tiktok.com/'
            }
        });

        if (!res.ok) return { views: null, error: `HTTP ${res.status}` };
        const text = await res.text();

        // Look for "playCount":1234
        const playCountMatch = text.match(/"playCount":(\d+)/);
        if (playCountMatch) return { views: parseInt(playCountMatch[1]) };

        // Alternative pattern
        const statsMatch = text.match(/"playCount":\s*(\d+)/);
        if (statsMatch) return { views: parseInt(statsMatch[1]) };

        return { views: null, error: 'Could not parse views' };

    } catch (e) {
        return { views: null, error: (e as Error).message };
    }
}

import { fetchWithYtDlp } from "./youtube-dl"

// ... (existing helper function)

// ... (existing fetchSocialStats function)

// ... (existing fetchYouTubeStats function)

// ... (existing fetchTikTokStats function)

async function fetchFacebookStats(url: string) {
    try {
        // Strategy 1: "Lazy Genius" Method - yt-dlp
        // Most robust method, handles cookies internally or via parsing
        // We pass the URL to our wrapper
        const ytDlpResult = await fetchWithYtDlp(url)
        if (ytDlpResult.views !== null) {
            return { views: ytDlpResult.views }
        }

        // Strategy 2: Use www.facebook.com with Desktop User Agent + Cookie
        // Mobile site (m.facebook.com) is blocking scraper even with cookies.

        // Ensure we are using www
        const desktopUrl = url.replace('m.facebook.com', 'www.facebook.com');

        const headers: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Upgrade-Insecure-Requests': '1'
        }

        if (process.env.FACEBOOK_COOKIE) {
            headers['Cookie'] = process.env.FACEBOOK_COOKIE
        }

        const res = await fetch(desktopUrl, { headers });

        if (!res.ok) return { views: null, error: `HTTP ${res.status}` };
        const text = await res.text();

        // Strategy 3: Look for "x views" in metadata or visible text
        // Example: <meta property="og:title" content="2.8M views ...">
        const viewsRegex = /([\d,.]+[KMB]?)\s+views/i;
        const match = text.match(viewsRegex);
        if (match) {
            let numStr = match[1].replace(/,/g, '');
            let multiplier = 1;
            if (numStr.toUpperCase().includes('K')) {
                multiplier = 1000;
                numStr = numStr.replace(/K/i, '');
            } else if (numStr.toUpperCase().includes('M')) {
                multiplier = 1000000;
                numStr = numStr.replace(/M/i, '');
            } else if (numStr.toUpperCase().includes('B')) {
                multiplier = 1000000000;
                numStr = numStr.replace(/B/i, '');
            }
            return { views: Math.floor(parseFloat(numStr) * multiplier) };
        }

        return { views: null, error: 'Could not parse views (FB Desktop + yt-dlp failed)' };
    } catch (e) {
        return { views: null, error: (e as Error).message };
    }
}

