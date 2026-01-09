"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Video,
  DollarSign,
  Users,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  CalendarRange,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts"

interface Stats {
  videos: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
  expenses: {
    total: number
    byCategory: Record<string, number>
  }
  salaries: {
    total: number
    paid: number
    pending: number
  }
  subscriptions: {
    monthlyCost: number
    count: number
  }
  team: {
    total: number
    byRole: Array<{ role: string; _count: { role: number } }>
  }
  recentVideos: Array<{
    id: string
    title: string
    status: string
    createdAt: string
    uploadedBy: { name: string }
  }>
  recentExpenses: Array<{
    id: string
    title: string
    amount: number
    category: string
    date: string
  }>
  monthlyData: Record<string, number>
}

const COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b"]

const categoryLabels: Record<string, string> = {
  OFFICE_RENT: "Office Rent",
  OFFICE_EXPENSE: "Office Expense",
  AI_SUBSCRIPTION: "AI Subscription",
  SOFTWARE: "Software",
  EQUIPMENT: "Equipment",
  OTHER: "Other",
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState("this-month")
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    fetchStats()
  }, [filterType, selectedMonth])

  const fetchStats = async () => {
    try {
      let query = ""
      const now = new Date()
      // Helper to format YYYY-MM
      const formatMonth = (d: Date) => {
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        return `${year}-${month}`
      }

      if (filterType === 'custom') {
        query = `?month=${selectedMonth}`
      } else if (filterType === 'this-month') {
        query = `?month=${formatMonth(now)}`
      } else if (filterType === 'last-month') {
        const last = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        query = `?month=${formatMonth(last)}`
      } else {
        // Range filters
        let startDate: Date | null = null
        const endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59))

        if (filterType === '3m') {
          startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 2, 1))
        } else if (filterType === '6m') {
          startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 5, 1))
        } else if (filterType === 'year') {
          startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 11, 1))
        } else if (filterType === 'all') {
          startDate = null
        }

        if (startDate) {
          query = `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        }
      }

      const res = await fetch(`/api/stats${query}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-2" />
          <div className="h-4 bg-slate-200 rounded w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const pieData = stats?.expenses?.byCategory
    ? Object.entries(stats.expenses.byCategory).map(([name, value]) => ({
      name: categoryLabels[name] || name,
      value,
    }))
    : []

  const areaData = stats?.monthlyData
    ? Object.entries(stats.monthlyData).map(([month, amount]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short" }),
      amount,
    }))
    : []

  const videoStatusData = stats?.videos
    ? [
      { name: "Pending", value: stats.videos.pending, color: "#f59e0b" },
      { name: "Approved", value: stats.videos.approved, color: "#10b981" },
      { name: "Rejected", value: stats.videos.rejected, color: "#ef4444" },
    ]
    : []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="warning">Pending</Badge>
      case "APPROVED":
        return <Badge variant="success">Approved</Badge>
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>
      case "PUBLISHED":
        return <Badge variant="info">Published</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const showFinancials = session?.user?.role === "ADMIN" || session?.user?.role === "INVESTOR"

  // Calculate generic total burn (Expenses + Salaries + Subscriptions)
  const totalOutgoing = (stats?.expenses?.total || 0) + (stats?.salaries?.total || 0) + (stats?.subscriptions?.monthlyCost || 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {session?.user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-slate-500 mt-1">
            Here&apos;s what&apos;s happening with your content business today.
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
          <Tabs value={filterType} onValueChange={setFilterType} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All Time</TabsTrigger>
              <TabsTrigger value="this-month">This Month</TabsTrigger>
              <TabsTrigger value="last-month">Last Month</TabsTrigger>
              <TabsTrigger value="3m">3 Months</TabsTrigger>
              <TabsTrigger value="6m">6 Months</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
              <TabsTrigger value="custom">
                <CalendarRange className="w-4 h-4 mr-2" />
                Custom
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {filterType === 'custom' && (
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-40"
            />
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg shadow-violet-500/5 bg-gradient-to-br from-white to-violet-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Videos</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.videos?.total || 0}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-amber-600 font-medium">
                    {stats?.videos?.pending || 0} pending
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Video className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Views Card - Visible to everyone */}
        <Card className="border-0 shadow-lg shadow-pink-500/5 bg-gradient-to-br from-white to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Social Views</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{(stats as any)?.socialViews?.toLocaleString() || 0}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-pink-600 font-medium">Across all platforms</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {showFinancials && (
          <>
            <Card className="border-0 shadow-lg shadow-emerald-500/5 bg-gradient-to-br from-white to-emerald-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Expenses</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {formatCurrency(totalOutgoing)}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium">
                        Includes salaries & subscriptions
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg shadow-amber-500/5 bg-gradient-to-br from-white to-amber-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Monthly Subscriptions</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {formatCurrency(stats?.subscriptions?.monthlyCost || 0)}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-xs text-amber-600 font-medium">
                        {stats?.subscriptions?.count || 0} active
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts - Financials only for permitted roles */}
      {showFinancials && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense Trend */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Expense Trend</CardTitle>
              <CardDescription>Monthly expenses over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${value}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      }}
                      formatter={(value) => [formatCurrency(value as number), "Amount"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Expense by Category */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Expenses by Category</CardTitle>
              <CardDescription>Distribution of expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      }}
                      formatter={(value) => [formatCurrency(value as number), "Amount"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Video Status & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Status Chart */}
        {/* Video Status Chart */}
        <Card className="border-0 shadow-lg col-span-1 lg:col-span-1 min-w-0">
          <CardHeader>
            <CardTitle className="text-lg">Video Status</CardTitle>
            <CardDescription>Overview of video statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Added relative and w-full to ensure container takes space */}
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={videoStatusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {videoStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Videos */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Recent Videos</CardTitle>
            <CardDescription>Latest uploaded videos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!stats?.recentVideos?.length ? (
                <p className="text-sm text-slate-500 text-center py-4">No videos yet</p>
              ) : (
                stats?.recentVideos?.map((video) => (
                  <div key={video.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Video className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{video.title}</p>
                      <p className="text-xs text-slate-500">{video.uploadedBy.name}</p>
                    </div>
                    {getStatusBadge(video.status)}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Expenses - Only if authorized */}
        {showFinancials && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Recent Expenses</CardTitle>
              <CardDescription>Latest recorded expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!stats?.recentExpenses?.length ? (
                  <p className="text-sm text-slate-500 text-center py-4">No expenses yet</p>
                ) : (
                  stats?.recentExpenses?.map((expense) => (
                    <div key={expense.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{expense.title}</p>
                        <p className="text-xs text-slate-500">
                          {categoryLabels[expense.category] || expense.category}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
