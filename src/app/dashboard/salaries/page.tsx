"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils"
import {
  CreditCard,
  Plus,
  Users,
  CheckCircle,
  Clock,
  Loader2,
  DollarSign,
  MoreHorizontal,
  CalendarRange,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface Salary {
  id: string
  employeeName: string
  amount: number
  month: string
  status: string
  paidAt: string | null
  addedBy: { name: string }
}

export default function SalariesPage() {
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    employeeName: "",
    amount: "",
    month: new Date().toISOString().slice(0, 7),
    status: "PENDING",
  })

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [filterType, setFilterType] = useState("all")
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSalaries()
  }, [filterType, selectedMonth])

  const fetchSalaries = async () => {
    setLoading(true)
    try {
      let query = ""

      const now = new Date()
      // Helper to format YYYY-MM
      const fmt = (d: Date) => d.toISOString().slice(0, 7)

      if (filterType === 'custom') {
        query = `?month=${selectedMonth}`
      } else if (filterType === 'this-month') {
        query = `?startMonth=${fmt(now)}&endMonth=${fmt(now)}`
      } else if (filterType === 'last-month') {
        const last = new Date(now)
        last.setMonth(now.getMonth() - 1)
        query = `?startMonth=${fmt(last)}&endMonth=${fmt(last)}`
      } else if (filterType === '3m') {
        const start = new Date(now)
        start.setMonth(now.getMonth() - 2) // Current + prev 2 = 3 months
        query = `?startMonth=${fmt(start)}&endMonth=${fmt(now)}`
      } else if (filterType === '6m') {
        const start = new Date(now)
        start.setMonth(now.getMonth() - 5)
        query = `?startMonth=${fmt(start)}&endMonth=${fmt(now)}`
      } else if (filterType === 'year') {
        const start = new Date(now)
        start.setMonth(now.getMonth() - 11)
        query = `?startMonth=${fmt(start)}&endMonth=${fmt(now)}`
      }
      // 'all' sends no params

      const res = await fetch(`/api/salaries${query}`)
      const data = await res.json()
      setSalaries(data)
    } catch (error) {
      console.error("Error fetching salaries:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingId ? `/api/salaries/${editingId}` : "/api/salaries"
      const method = editingId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setDialogOpen(false)
        fetchSalaries() // Refresh list
        resetForm()
      }
    } catch (error) {
      console.error("Error saving salary:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this salary record?")) return

    try {
      const res = await fetch(`/api/salaries/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setSalaries(salaries.filter(s => s.id !== id))
      } else {
        alert("Failed to delete salary record")
      }
    } catch (error) {
      console.error("Error deleting salary:", error)
    }
  }

  const openEditDialog = (salary: Salary) => {
    setEditingId(salary.id)
    setFormData({
      employeeName: salary.employeeName,
      amount: salary.amount.toString(),
      month: salary.month,
      status: salary.status,
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      employeeName: "",
      amount: "",
      month: new Date().toISOString().slice(0, 7),
      status: "PENDING",
    })
  }

  const totalSalaries = salaries.reduce((sum, s) => sum + s.amount, 0)
  const paidSalaries = salaries.filter((s) => s.status === "PAID").reduce((sum, s) => sum + s.amount, 0)
  const pendingSalaries = salaries.filter((s) => s.status === "PENDING").reduce((sum, s) => sum + s.amount, 0)

  // Group by employee for chart
  const byEmployee = salaries.reduce((acc, s) => {
    acc[s.employeeName] = (acc[s.employeeName] || 0) + s.amount
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(byEmployee).map(([name, amount]) => ({
    name: name.split(" ")[0],
    amount,
  }))

  const COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981"]

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Salaries</h1>
          <p className="text-slate-500">Manage employee salaries and payments</p>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
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

          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Salary
          </Button>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Salary Record" : "Add Salary Record"}</DialogTitle>
              <DialogDescription>{editingId ? "Update salary details" : "Record a salary payment"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeName">Employee Name</Label>
                <Input
                  id="employeeName"
                  placeholder="John Doe"
                  value={formData.employeeName}
                  onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="month">Month</Label>
                <Input
                  id="month"
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="salary-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Salary"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-violet-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Salaries</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(totalSalaries)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Paid</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(paidSalaries)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(pendingSalaries)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Employees</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{Object.keys(byEmployee).length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">By Employee</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${value}`} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={60} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      }}
                      formatter={(value) => [formatCurrency(value as number), "Amount"]}
                    />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Salary List */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Salary Records</CardTitle>
          </CardHeader>
          <CardContent>
            {salaries.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No salary records yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {salaries.map((salary) => (
                  <div
                    key={salary.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{salary.employeeName}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(salary.month + "-01").toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                        })}
                      </p>
                    </div>
                    <Badge variant={salary.status === "PAID" ? "success" : "warning"}>
                      {salary.status === "PAID" ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Paid
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </>
                      )}
                    </Badge>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-slate-900">{formatCurrency(salary.amount)}</p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(salary)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(salary.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
