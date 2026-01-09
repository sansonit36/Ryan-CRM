import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("timeRange")
    const month = searchParams.get("month")

    // Time Range Filter (for Social Stats)
    let dateFilter = {}
    if (timeRange && timeRange !== "all") {
      const now = new Date()
      const days = parseInt(timeRange.replace("d", ""))
      if (!isNaN(days)) {
        const pastDate = new Date(now.setDate(now.getDate() - days))
        if (!isNaN(pastDate.getTime())) {
          dateFilter = {
            postedAt: {
              gte: pastDate
            }
          }
        }
      }
    }

    // Date Filters (Financials)
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")

    let expenseWhere: any = {}
    let salaryWhere: any = {}

    if (startDateParam && endDateParam) {
      // Range Filter
      const start = new Date(startDateParam)
      const end = new Date(endDateParam)

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        expenseWhere = {
          date: {
            gte: start,
            lte: end,
          },
        }

        // Convert date range to YYYY-MM strings for Salary comparison
        const startMonthStr = start.toISOString().slice(0, 7)
        const endMonthStr = end.toISOString().slice(0, 7)

        salaryWhere = {
          month: {
            gte: startMonthStr,
            lte: endMonthStr
          }
        }
      }
    } else if (month) {
      // Single Month Filter (legacy/custom)
      const startDate = new Date(`${month}-01`)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59)

      expenseWhere = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }

      salaryWhere = {
        month: month
      }
    }

    // Monthly expenses params (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Execute all independent queries in parallel
    const [
      totalVideos,
      pendingVideos,
      approvedVideos,
      rejectedVideos,
      expenses,
      salaries,
      subscriptions,
      totalUsers,
      usersByRole,
      recentVideos,
      recentExpenses,
      monthlyExpenses,
      socialPosts,
      linkedVideos
    ] = await Promise.all([
      // Video Counts
      prisma.video.count(),
      prisma.video.count({ where: { status: "PENDING" } }),
      prisma.video.count({ where: { status: "APPROVED" } }),
      prisma.video.count({ where: { status: "REJECTED" } }),

      // Expenses
      prisma.expense.findMany({ where: expenseWhere }),

      // Salaries
      prisma.salary.findMany({ where: salaryWhere }),

      // Subscriptions
      prisma.subscription.findMany({ where: { status: "ACTIVE" } }),

      // Team
      prisma.user.count(),
      prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
      }),

      // Recent Activity
      prisma.video.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: { name: true } },
        },
      }),
      prisma.expense.findMany({
        take: 5,
        orderBy: { date: "desc" },
      }),

      // Monthly Expenses (last 6 months)
      prisma.expense.findMany({
        where: { date: { gte: sixMonthsAgo } },
        orderBy: { date: "asc" },
      }),

      // Social Stats
      (prisma as any).socialPost.findMany({
        where: dateFilter,
      }),

      // Top Performing Videos (Social)
      prisma.video.findMany({
        where: {
          socialPosts: {
            some: dateFilter
          }
        },
        include: {
          socialPosts: {
            where: dateFilter
          }
        },
        take: 20,
      })
    ])

    // Process Expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const expensesByCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {} as Record<string, number>)

    // Process Salaries
    const totalSalaries = salaries.reduce((sum, s) => sum + s.amount, 0)
    const paidSalaries = salaries.filter(s => s.status === "PAID").reduce((sum, s) => sum + s.amount, 0)
    const pendingSalaries = salaries.filter(s => s.status === "PENDING").reduce((sum, s) => sum + s.amount, 0)

    // Process Subscriptions
    const monthlySubscriptionCost = subscriptions.reduce((sum, s) => {
      if (s.billingCycle === "MONTHLY") return sum + s.amount
      if (s.billingCycle === "YEARLY") return sum + (s.amount / 12)
      return sum
    }, 0)

    // Process Monthly Data
    const monthlyData = monthlyExpenses.reduce((acc, e) => {
      const month = e.date.toISOString().slice(0, 7)
      acc[month] = (acc[month] || 0) + e.amount
      return acc
    }, {} as Record<string, number>)

    // Process Social Stats
    const totalSocialViews = socialPosts.reduce((sum: number, post: any) => sum + post.views, 0)
    const socialViewsByPlatform = socialPosts.reduce((acc: Record<string, number>, post: any) => {
      acc[post.platform] = (acc[post.platform] || 0) + post.views
      return acc
    }, {} as Record<string, number>)

    const topSocialVideos = linkedVideos
      .map((video: any) => ({
        id: video.id,
        title: video.title,
        status: video.status,
        totalViews: video.socialPosts.reduce((sum: number, p: any) => sum + p.views, 0),
        platforms: video.socialPosts.map((p: any) => ({ platform: p.platform, views: p.views }))
      }))
      .sort((a: any, b: any) => b.totalViews - a.totalViews)

    return NextResponse.json({
      socialViews: totalSocialViews,
      socialViewsByPlatform,
      topSocialVideos,
      videos: {
        total: totalVideos,
        pending: pendingVideos,
        approved: approvedVideos,
        rejected: rejectedVideos,
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
      },
      salaries: {
        total: totalSalaries,
        paid: paidSalaries,
        pending: pendingSalaries,
      },
      subscriptions: {
        monthlyCost: monthlySubscriptionCost,
        count: subscriptions.length,
      },
      team: {
        total: totalUsers,
        byRole: usersByRole,
      },
      recentVideos,
      recentExpenses,
      monthlyData,
    })
  } catch (error) {
    console.error("STATS_API_ERROR_DETAILS:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name,
    })
    return NextResponse.json({
      error: "Internal server error",
      details: (error as Error).message
    }, { status: 500 })
  }
}
