import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchSocialStats } from "@/lib/social-scraper"

export async function POST(req: Request) {
    try {
        const socialPosts = await prisma.socialPost.findMany()
        const results = { updated: 0, failed: 0 }

        // Update stats using real scraper 
        const updates = socialPosts.map(async (post) => {
            if (!post.url) return;

            // Only scrape supported platforms 
            if (['YOUTUBE', 'TIKTOK', 'FACEBOOK'].includes(post.platform)) {
                const { views, error } = await fetchSocialStats(post.url, post.platform);

                if (views !== null && !isNaN(views)) {
                    await prisma.socialPost.update({
                        where: { id: post.id },
                        data: { views: views }
                    });
                    results.updated++;
                } else {
                    console.warn(`Failed to scrape ${post.platform} URL: ${post.url} - ${error}`);
                    results.failed++;
                }
            } else {
                // For unsupported platforms, keep existing views or manual update
                // results.skipped++;
            }
        })

        await Promise.all(updates)

        return NextResponse.json({
            success: true,
            message: `Scraping complete. Updated: ${results.updated}, Failed: ${results.failed}`
        })
    } catch (error) {
        console.error("Error updating stats:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
