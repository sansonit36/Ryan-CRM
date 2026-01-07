"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  PieChart as PieChartIcon,
  BarChart3,
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

export default function FinancialsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    fetchStats()
  }, [selectedMonth])

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/stats?month=${selectedMonth}`)
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const totalExpenses = stats?.expenses.total || 0
  const totalSalaries = stats?.salaries.total || 0
  const monthlySubscriptions = stats?.subscriptions.monthlyCost || 0
  const totalMonthlyBurn = totalExpenses + totalSalaries + monthlySubscriptions

  const pieData = stats?.expenses.byCategory
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

  const breakdownData = [
    { name: "Expenses", value: totalExpenses, fill: "#8b5cf6" },
    { name: "Salaries", value: totalSalaries, fill: "#10b981" },
    { name: "Subscriptions", value: monthlySubscriptions, fill: "#f59e0b" },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Overview</h1>
          <p className="text-slate-500">Detailed financial analysis and metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-violet-100">Total Expenses</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-100">Total Salaries</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalSalaries)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-100">Monthly Subscriptions</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(monthlySubscriptions)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Total Burn Rate</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalMonthlyBurn)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Trend */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Expense Trend</CardTitle>
                <CardDescription>Monthly expenses over time</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#colorExpense)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <PieChartIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Expense Breakdown</CardTitle>
                <CardDescription>Expenses by category</CardDescription>
              </div>
            </div>
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

      {/* Cost Breakdown */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Cost Distribution</CardTitle>
          <CardDescription>Breakdown of all costs by type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdownData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${value}`} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value) => [formatCurrency(value as number), "Amount"]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {breakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
