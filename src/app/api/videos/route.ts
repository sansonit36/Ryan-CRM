import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const videos = await prisma.video.findMany({
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
        reviews: {
          include: {
            reviewer: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        socialPosts: {
          orderBy: { postedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(videos)
  } catch (error) {
    console.error("Error fetching videos:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, googleDriveUrl, thumbnailUrl } = await req.json()

    if (!title || !googleDriveUrl) {
      return NextResponse.json(
        { error: "Title and Google Drive URL are required" },
        { status: 400 }
      )
    }

    const video = await prisma.video.create({
      data: {
        title,
        description,
        googleDriveUrl,
        thumbnailUrl,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(video)
  } catch (error) {
    console.error("Error creating video:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
