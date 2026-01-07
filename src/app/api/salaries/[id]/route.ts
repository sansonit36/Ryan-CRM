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
        const { employeeName, amount, month, status } = await req.json()

        const salary = await prisma.salary.update({
            where: { id },
            data: {
                employeeName,
                amount: amount ? parseFloat(amount) : undefined,
                month,
                status,
            },
            include: {
                addedBy: {
                    select: { id: true, name: true },
                },
            },
        })

        return NextResponse.json(salary)
    } catch (error) {
        console.error("Error updating salary:", error)
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

        await prisma.salary.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting salary:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
