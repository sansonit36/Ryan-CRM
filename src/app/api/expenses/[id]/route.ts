import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabase } from "@/lib/supabase"

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

        // Fetch expense to get receipt URL
        const expense = await prisma.expense.findUnique({
            where: { id },
        })

        if (!expense) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 })
        }

        // Delete receipt from Supabase if it exists
        if (expense.receiptUrl && expense.receiptUrl.includes("supabase.co")) {
            try {
                // Extract filename from URL
                // URL format: .../storage/v1/object/public/receipts/filename.ext
                const parts = expense.receiptUrl.split("/receipts/")
                if (parts.length === 2) {
                    const filename = parts[1]
                    const { error: storageError } = await supabase.storage
                        .from('receipts')
                        .remove([filename])

                    if (storageError) {
                        console.error("Error deleting image from storage:", storageError)
                        // Continue to delete expense even if image delete fails
                    }
                }
            } catch (err) {
                console.error("Error parsing/deleting image:", err)
            }
        }

        await prisma.expense.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting expense:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
