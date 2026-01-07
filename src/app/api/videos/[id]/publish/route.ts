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

    // Only Admin, Social Manager and Investor can add published links
    if (session.user.role !== "ADMIN" && session.user.role !== "SOCIAL_MANAGER" && session.user.role !== "INVESTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    // No body needed just toggling status

    const video = await prisma.video.update({
      where: { id },
      data: {
        status: "PUBLISHED",
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(video)
  } catch (error) {
    console.error("Publish error:", error)
    return NextResponse.json({ error: "Failed to publish video" }, { status: 500 })
  }
}
