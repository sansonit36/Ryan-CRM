
const fetch = require('node-fetch'); // Assuming node environment or built-in fetch in newer node

async function testFetch() {
    console.log("Testing YouTube Fetch...");
    try {
        const ytRes = await fetch("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        const ytText = await ytRes.text();
        // Look for view count patterns
        // simple regex for "viewCount":"123456"
        const ytMatch = ytText.match(/"viewCount":"(\d+)"/);
        console.log("YouTube Status:", ytRes.status);
        if (ytMatch) {
            console.log("YouTube Views Found:", ytMatch[1]);
        } else {
            console.log("YouTube Views NOT Found in HTML");
        }
    } catch (e) {
        console.error("YouTube Fetch Failed:", e.message);
    }

    /*
    // TikTok often blocks non-browser UAs, but let's try
    console.log("\nTesting TikTok Fetch...");
    try {
        const ttRes = await fetch("https://www.tiktok.com/@tiktok/video/7106733230676446506", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36"
            }
        });
        const ttText = await ttRes.text();
        console.log("TikTok Status:", ttRes.status);
        // TikTok structure changes often, looking for general numbers might be hard without specific class names
         // But let's check title or something
         console.log("TikTok HTML length:", ttText.length);
    } catch (e) {
        console.error("TikTok Fetch Failed:", e.message);
    }
    */
}

testFetch();
