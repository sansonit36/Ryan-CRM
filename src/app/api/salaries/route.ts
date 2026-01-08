import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

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
      where = {
        month: month,
      }
    }

    const salaries = await prisma.salary.findMany({
      where,
      include: {
        addedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(salaries)
  } catch (error) {
    console.error("Error fetching salaries:", error)
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

    const { employeeName, amount, month, status } = await req.json()

    if (!employeeName || !amount || !month) {
      return NextResponse.json(
        { error: "Employee name, amount, and month are required" },
        { status: 400 }
      )
    }

    const salary = await prisma.salary.create({
      data: {
        employeeName,
        amount: parseFloat(amount),
        month,
        status: status || "PENDING",
        addedById: session.user.id,
      },
      include: {
        addedBy: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(salary)
  } catch (error) {
    console.error("Error creating salary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
