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
      const [yearStr, monthStr] = month.split("-")
      const year = parseInt(yearStr)
      const monthIndex = parseInt(monthStr) - 1

      const startDate = new Date(Date.UTC(year, monthIndex, 1))
      const endDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999))

      where = {
        nextBillingDate: {
          gte: startDate,
          lte: endDate,
        },
      }
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      orderBy: { nextBillingDate: "asc" },
    })

    return NextResponse.json(subscriptions)
  } catch (error) {
    console.error("Error fetching subscriptions:", error)
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

    const { name, description, amount, billingCycle, nextBillingDate, category } = await req.json()

    if (!name || !amount || !billingCycle || !nextBillingDate || !category) {
      return NextResponse.json(
        { error: "Name, amount, billing cycle, next billing date, and category are required" },
        { status: 400 }
      )
    }

    const subscription = await prisma.subscription.create({
      data: {
        name,
        description,
        amount: parseFloat(amount),
        billingCycle,
        nextBillingDate: new Date(nextBillingDate),
        category,
      },
    })

    return NextResponse.json(subscription)
  } catch (error) {
    console.error("Error creating subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
