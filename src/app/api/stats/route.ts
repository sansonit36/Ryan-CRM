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
        dateFilter = {
          postedAt: {
            gte: pastDate
          }
        }
      }
    }

    // Month Filter (for Financials)
    let expenseWhere = {}
    let salaryWhere = {}

    if (month) {
      // Expense filter (DateTime)
      const startDate = new Date(`${month}-01`)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59)
      expenseWhere = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }

      // Salary filter (String YYYY-MM)
      salaryWhere = {
        month: month
      }
    }

    // Get video stats
    const totalVideos = await prisma.video.count()
    const pendingVideos = await prisma.video.count({ where: { status: "PENDING" } })
    const approvedVideos = await prisma.video.count({ where: { status: "APPROVED" } })
    const rejectedVideos = await prisma.video.count({ where: { status: "REJECTED" } })

    // Get expense stats
    const expenses = await prisma.expense.findMany({ where: expenseWhere })
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

    // Get expense by category
    const expensesByCategory = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount
      return acc
    }, {} as Record<string, number>)

    // Get salary stats
    const salaries = await prisma.salary.findMany({ where: salaryWhere })
    const totalSalaries = salaries.reduce((sum, s) => sum + s.amount, 0)
    const paidSalaries = salaries.filter(s => s.status === "PAID").reduce((sum, s) => sum + s.amount, 0)
    const pendingSalaries = salaries.filter(s => s.status === "PENDING").reduce((sum, s) => sum + s.amount, 0)

    // Get subscription stats (Always active ones, monthly burn doesn't change by history usually)
    const subscriptions = await prisma.subscription.findMany({ where: { status: "ACTIVE" } })
    const monthlySubscriptionCost = subscriptions.reduce((sum, s) => {
      if (s.billingCycle === "MONTHLY") return sum + s.amount
      if (s.billingCycle === "YEARLY") return sum + (s.amount / 12)
      return sum
    }, 0)

    // Get team stats
    const totalUsers = await prisma.user.count()
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    })

    // Get recent videos
    const recentVideos = await prisma.video.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: { select: { name: true } },
      },
    })

    // Get recent expenses
    const recentExpenses = await prisma.expense.findMany({
      take: 5,
      orderBy: { date: "desc" },
    })

    // Monthly expenses data for chart (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyExpenses = await prisma.expense.findMany({
      where: { date: { gte: sixMonthsAgo } },
      orderBy: { date: "asc" },
    })

    const monthlyData = monthlyExpenses.reduce((acc, e) => {
      const month = e.date.toISOString().slice(0, 7)
      acc[month] = (acc[month] || 0) + e.amount
      return acc
    }, {} as Record<string, number>)

    // Social Stats with Time Filter
    const socialPosts = await prisma.socialPost.findMany({
      where: dateFilter,
    })

    const totalSocialViews = socialPosts.reduce((sum: number, post: any) => sum + post.views, 0)

    // Calculate views by platform
    const socialViewsByPlatform = socialPosts.reduce((acc: Record<string, number>, post: any) => {
      acc[post.platform] = (acc[post.platform] || 0) + post.views
      return acc
    }, {} as Record<string, number>)

    // Top Performing Social Videos
    // Fetch videos that have social posts matching the filter
    const linkedVideos = await prisma.video.findMany({
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
      take: 20, // Increased from 5 to 20 to show more individual video stats
    })

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
