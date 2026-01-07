import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (session.user.role !== "ADMIN" && session.user.role !== "SOCIAL_MANAGER" && session.user.role !== "INVESTOR") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { id } = await params
        const { platform, url } = await request.json()

        if (!platform || !url) {
            return NextResponse.json({ error: "Platform and URL are required" }, { status: 400 })
        }

        const socialPost = await prisma.socialPost.create({
            data: {
                videoId: id,
                platform,
                url,
                views: 0, // Initial views
                postedAt: new Date(),
            },
        })

        // Also update video status to PUBLISHED if not already
        await prisma.video.update({
            where: { id },
            data: { status: "PUBLISHED" },
        })

        return NextResponse.json(socialPost)
    } catch (error) {
        console.error("Error creating social post:", error)
        return NextResponse.json({ error: "Failed to add social link" }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // This ID is actually the VIDEO ID, but we usually delete by Post ID. 
    // Wait, standard pattern is /api/videos/[id]/social?postId=... or /api/social/[postId]
    // Let's use Query param for PostID to keep it under /videos/[id] or just create separate /api/social-posts/[id]
    // The user plan said: /api/videos/[id]/social/route.ts
) {
    // Actually, to delete a specific social post, we need its ID.
    // Passing it via body or query param is easiest here.

    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check permissions...
        if (session.user.role !== "ADMIN" && session.user.role !== "SOCIAL_MANAGER" && session.user.role !== "INVESTOR") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const postId = searchParams.get("postId")

        if (!postId) {
            return NextResponse.json({ error: "Post ID required" }, { status: 400 })
        }

        await prisma.socialPost.delete({
            where: { id: postId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting social post:", error)
        return NextResponse.json({ error: "Failed to delete social post" }, { status: 500 })
    }
}
