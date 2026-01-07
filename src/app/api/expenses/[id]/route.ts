import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (session.user.role !== "ADMIN" && session.user.role !== "INVESTOR") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { id } = await params
        const { title, description, amount, category, receiptUrl, date } = await req.json()

        const expense = await prisma.expense.update({
            where: { id },
            data: {
                title,
                description,
                amount: amount ? parseFloat(amount) : undefined,
                category,
                receiptUrl,
                date: date ? new Date(date) : undefined,
            },
            include: {
                addedBy: {
                    select: { id: true, name: true },
                },
            },
        })

        return NextResponse.json(expense)
    } catch (error) {
        console.error("Error updating expense:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (session.user.role !== "ADMIN" && session.user.role !== "INVESTOR") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { id } = await params

        await prisma.expense.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting expense:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
