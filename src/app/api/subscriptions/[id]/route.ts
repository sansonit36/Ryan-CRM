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
        const { name, description, amount, billingCycle, nextBillingDate, category, status } = await req.json()

        const subscription = await prisma.subscription.update({
            where: { id },
            data: {
                name,
                description,
                amount: amount ? parseFloat(amount) : undefined,
                billingCycle,
                nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : undefined,
                category,
                status,
            },
        })

        return NextResponse.json(subscription)
    } catch (error) {
        console.error("Error updating subscription:", error)
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

        await prisma.subscription.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting subscription:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
