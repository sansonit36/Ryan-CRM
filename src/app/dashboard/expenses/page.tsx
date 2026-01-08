"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  DollarSign,
  Plus,
  Building,
  Laptop,
  Sparkles,
  Package,
  MoreHorizontal,
  Receipt,
  Loader2,
  ExternalLink,
  Upload,
  X,
  ImageIcon,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"

interface Expense {
  id: string
  title: string
  description: string | null
  amount: number
  category: string
  receiptUrl: string | null
  date: string
  addedBy: { name: string }
}

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  OFFICE_RENT: { label: "Office Rent", icon: <Building className="w-4 h-4" />, color: "#8b5cf6" },
  OFFICE_EXPENSE: { label: "Office Expense", icon: <Package className="w-4 h-4" />, color: "#6366f1" },
  AI_SUBSCRIPTION: { label: "AI Subscription", icon: <Sparkles className="w-4 h-4" />, color: "#3b82f6" },
  SOFTWARE: { label: "Software", icon: <Laptop className="w-4 h-4" />, color: "#06b6d4" },
  EQUIPMENT: { label: "Equipment", icon: <Package className="w-4 h-4" />, color: "#10b981" },
  OTHER: { label: "Other", icon: <MoreHorizontal className="w-4 h-4" />, color: "#f59e0b" },
}

const COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b"]

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    category: "",
    receiptUrl: "",
    date: new Date().toISOString().split("T")[0],
  })

  // Filter State
  const [filterType, setFilterType] = useState<"ALL" | "THIS_MONTH" | "LAST_MONTH" | "LAST_3_MONTHS" | "LAST_6_MONTHS" | "LAST_12_MONTHS" | "CUSTOM">("THIS_MONTH")
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchExpenses()
  }, [filterType, selectedMonth])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      let url = "/api/expenses"

      const now = new Date()
      let startDate: Date | null = null
      let endDate: Date | null = null

      if (filterType === "THIS_MONTH") {
        url += `?month=${now.toISOString().slice(0, 7)}`
      } else if (filterType === "LAST_MONTH") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        url += `?month=${lastMonth.toISOString().slice(0, 7)}`
      } else if (filterType === "CUSTOM") {
        url += `?month=${selectedMonth}`
      } else if (filterType !== "ALL") {
        // Range filters
        endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999))

        if (filterType === "LAST_3_MONTHS") {
          startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 3, 1))
        } else if (filterType === "LAST_6_MONTHS") {
          startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 6, 1))
        } else if (filterType === "LAST_12_MONTHS") {
          startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 12, 1))
        }

        if (startDate && endDate) {
          url += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        }
      }

      console.log(`Fetching expenses with URL: ${url}`)
      const res = await fetch(url)
      const data = await res.json()
      setExpenses(data)
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setLoading(false)
    }
  }

  // ... (handleFileChange, removeReceipt, uploadReceipt remain same)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP).")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Maximum size is 5MB.")
      return
    }

    setReceiptFile(file)
    setReceiptPreview(URL.createObjectURL(file))
  }

  const removeReceipt = () => {
    setReceiptFile(null)
    setReceiptPreview(null)
    setFormData({ ...formData, receiptUrl: "" })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadReceipt = async (): Promise<string | null> => {
    if (!receiptFile) return null

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", receiptFile)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      if (res.ok) {
        const { url } = await res.json()
        return url
      }
      return null
    } catch (error) {
      console.error("Error uploading receipt:", error)
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Upload receipt if selected
      let receiptUrl = formData.receiptUrl
      if (receiptFile) {
        const uploadedUrl = await uploadReceipt()
        if (uploadedUrl) {
          receiptUrl = uploadedUrl
        }
      }

      const url = editingId ? `/api/expenses/${editingId}` : "/api/expenses"
      const method = editingId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, receiptUrl }),
      })

      if (res.ok) {
        setDialogOpen(false)
        fetchExpenses() // Refresh list
        resetForm()
      }
    } catch (error) {
      console.error("Error saving expense:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return

    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setExpenses(expenses.filter(e => e.id !== id))
      } else {
        alert("Failed to delete expense")
      }
    } catch (error) {
      console.error("Error deleting expense:", error)
    }
  }

  const openEditDialog = (expense: Expense) => {
    setEditingId(expense.id)
    setFormData({
      title: expense.title,
      description: expense.description || "",
      amount: expense.amount.toString(),
      category: expense.category,
      receiptUrl: expense.receiptUrl || "",
      date: new Date(expense.date).toISOString().split("T")[0],
    })
    setReceiptPreview(expense.receiptUrl || null)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      title: "",
      description: "",
      amount: "",
      category: "",
      receiptUrl: "",
      date: new Date().toISOString().split("T")[0],
    })
    setReceiptFile(null)
    setReceiptPreview(null)
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const expensesByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name: categoryConfig[name]?.label || name,
    value,
  }))

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-slate-500">Track and manage business expenses</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Time Filters */}
      <div className="space-y-4">
        <Tabs value={filterType} onValueChange={(val: any) => setFilterType(val)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 h-auto">
            <TabsTrigger value="ALL">All Time</TabsTrigger>
            <TabsTrigger value="THIS_MONTH">This Month</TabsTrigger>
            <TabsTrigger value="LAST_MONTH">Last Month</TabsTrigger>
            <TabsTrigger value="LAST_3_MONTHS">Last 3M</TabsTrigger>
            <TabsTrigger value="LAST_6_MONTHS">Last 6M</TabsTrigger>
            <TabsTrigger value="LAST_12_MONTHS">Last 12M</TabsTrigger>
            <TabsTrigger value="CUSTOM">Custom</TabsTrigger>
          </TabsList>
        </Tabs>

        {filterType === "CUSTOM" && (
          <div className="flex justify-end animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
              <Label htmlFor="month-picker" className="text-sm font-medium">Select Month:</Label>
              <Input
                id="month-picker"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Expense" : "Add New Expense"}</DialogTitle>
            <DialogDescription>{editingId ? "Update expense details" : "Record a new business expense"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Expense title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              <Label htmlFor="expense-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="expense-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryConfig).map(([key, { label, icon }]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        {icon}
                        {label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Additional details"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Receipt Image (Optional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="receipt-upload"
              />
              {receiptPreview ? (
                <div className="relative">
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-dashed border-slate-200">
                    <Image
                      src={receiptPreview}
                      alt="Receipt preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeReceipt}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="receipt-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500">Click to upload receipt</span>
                  <span className="text-xs text-slate-400 mt-1">PNG, JPG, GIF up to 5MB</span>
                </label>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !formData.category}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Expense"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>

      {/* Stats */ }
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Expenses</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Records</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{expenses.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Receipt className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Categories</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{Object.keys(expensesByCategory).length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
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
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                No data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense List */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No expenses recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${categoryConfig[expense.category]?.color}20` }}
                    >
                      <span style={{ color: categoryConfig[expense.category]?.color }}>
                        {categoryConfig[expense.category]?.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{expense.title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Badge variant="secondary" className="text-xs">
                          {categoryConfig[expense.category]?.label || expense.category}
                        </Badge>
                        <span>{formatDate(expense.date)}</span>
                        <span>• Added by {expense.addedBy.name}</span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <p className="font-semibold text-slate-900">{formatCurrency(expense.amount)}</p>
                      {expense.receiptUrl && (
                        <button
                          type="button"
                          onClick={() => setViewingReceipt(expense.receiptUrl)}
                          className="relative w-8 h-8 rounded-lg overflow-hidden border-2 border-slate-200 hover:border-violet-400 transition-colors flex-shrink-0"
                        >
                          {expense.receiptUrl.startsWith("/uploads/") ? (
                            <Image
                              src={expense.receiptUrl}
                              alt="Receipt"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-violet-100 flex items-center justify-center">
                              <ImageIcon className="w-3 h-3 text-violet-600" />
                            </div>
                          )}
                        </button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(expense)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(expense.id)}>
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

  {/* Receipt Viewer Modal */ }
  <Dialog open={!!viewingReceipt} onOpenChange={() => setViewingReceipt(null)}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Receipt</DialogTitle>
      </DialogHeader>
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
        {viewingReceipt && (
          viewingReceipt.startsWith("/uploads/") ? (
            <Image
              src={viewingReceipt}
              alt="Receipt"
              fill
              className="object-contain"
            />
          ) : (
            <iframe
              src={viewingReceipt}
              className="w-full h-full"
              title="Receipt"
            />
          )
        )}
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => setViewingReceipt(null)}
        >
          Close
        </Button>
        {viewingReceipt && (
          <a href={viewingReceipt} target="_blank" rel="noopener noreferrer">
            <Button>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Full Size
            </Button>
          </a>
        )}
      </DialogFooter>
    </DialogContent>
  </Dialog>
    </div >
  )
}
