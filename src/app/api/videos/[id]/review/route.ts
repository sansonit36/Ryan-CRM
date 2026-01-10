import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "SOCIAL_MANAGER" && session.user.role !== "ADMIN" && session.user.role !== "INVESTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const { status, feedback, audioUrl } = await req.json()

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Create review
    const review = await prisma.videoReview.create({
      data: {
        videoId: id,
        reviewerId: session.user.id,
        status,
        feedback,
        audioUrl,
      },
    })

    // Update video status
    await prisma.video.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error("Error reviewing video:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
