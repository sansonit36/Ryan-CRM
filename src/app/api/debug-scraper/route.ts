import { NextResponse } from "next/server"
import { fetchSocialStats } from "@/lib/social-scraper"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const url = searchParams.get("url")
    const platform = searchParams.get("platform") || "FACEBOOK"

    if (!url) {
        return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
    }

    try {
        // Fetch using our library
        const stats = await fetchSocialStats(url, platform)

        // Also do a raw fetch to inspect headers/HTML for debugging
        const rawRes = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            }
        })
        const text = await rawRes.text()

        return NextResponse.json({
            stats,
            debug: {
                status: rawRes.status,
                headers: Object.fromEntries(rawRes.headers.entries()),
                htmlLength: text.length,
                htmlSnippet: text.substring(0, 500) // First 500 chars to check for login/doctype
            }
        })
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
