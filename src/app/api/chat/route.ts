import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const messages = await prisma.teamMessage.findMany({
            take: 50,
            orderBy: { createdAt: "desc" },
            include: {
                sender: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        })

        return NextResponse.json(messages.reverse())
    } catch (error) {
        console.error("Error fetching messages:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { content, audioUrl } = await req.json()

        if (!content && !audioUrl) {
            return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
        }

        const message = await prisma.teamMessage.create({
            data: {
                content,
                audioUrl,
                senderId: session.user.id,
            },
            include: {
                sender: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        })

        return NextResponse.json(message)
    } catch (error) {
        console.error("Error creating message:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
