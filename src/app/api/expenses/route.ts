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

    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month")

    let where = {}
    if (month) {
      const startDate = new Date(`${month}-01`)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59)
      where = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        addedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: "desc" },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "INVESTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { title, description, amount, category, receiptUrl, date } = await req.json()

    if (!title || !amount || !category) {
      return NextResponse.json(
        { error: "Title, amount, and category are required" },
        { status: 400 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        description,
        amount: parseFloat(amount),
        category,
        receiptUrl,
        date: date ? new Date(date) : new Date(),
        addedById: session.user.id,
      },
      include: {
        addedBy: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
