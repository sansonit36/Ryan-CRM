"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  FileText,
  Plus,
  Sparkles,
  Cloud,
  Laptop,
  MoreHorizontal,
  Loader2,
  Calendar,
  RefreshCcw,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Subscription {
  id: string
  name: string
  description: string | null
  amount: number
  billingCycle: string
  nextBillingDate: string
  status: string
  category: string
}

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  AI: { label: "AI Tools", icon: <Sparkles className="w-4 h-4" />, color: "#8b5cf6" },
  SOFTWARE: { label: "Software", icon: <Laptop className="w-4 h-4" />, color: "#6366f1" },
  CLOUD: { label: "Cloud Services", icon: <Cloud className="w-4 h-4" />, color: "#3b82f6" },
  OTHER: { label: "Other", icon: <MoreHorizontal className="w-4 h-4" />, color: "#10b981" },
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    billingCycle: "MONTHLY",
    nextBillingDate: new Date().toISOString().split("T")[0],
    category: "",
  })

  const [selectedMonth, setSelectedMonth] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscriptions()
  }, [selectedMonth])

  const fetchSubscriptions = async () => {
    setLoading(true)
    try {
      const query = selectedMonth ? `?month=${selectedMonth}` : ""
      const res = await fetch(`/api/subscriptions${query}`)
      const data = await res.json()
      setSubscriptions(data)
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingId ? `/api/subscriptions/${editingId}` : "/api/subscriptions"
      const method = editingId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setDialogOpen(false)
        fetchSubscriptions() // Refresh list
        resetForm()
      }
    } catch (error) {
      console.error("Error saving subscription:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscription?")) return

    try {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setSubscriptions(subscriptions.filter(s => s.id !== id))
      } else {
        alert("Failed to delete subscription")
      }
    } catch (error) {
      console.error("Error deleting subscription:", error)
    }
  }

  const openEditDialog = (subscription: Subscription) => {
    setEditingId(subscription.id)
    setFormData({
      name: subscription.name,
      description: subscription.description || "",
      amount: subscription.amount.toString(),
      billingCycle: subscription.billingCycle,
      nextBillingDate: new Date(subscription.nextBillingDate).toISOString().split("T")[0],
      category: subscription.category,
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      name: "",
      description: "",
      amount: "",
      billingCycle: "MONTHLY",
      nextBillingDate: new Date().toISOString().split("T")[0],
      category: "",
    })
  }

  const activeSubscriptions = subscriptions.filter((s) => s.status === "ACTIVE")
  const monthlyTotal = activeSubscriptions.reduce((sum, s) => {
    if (s.billingCycle === "MONTHLY") return sum + s.amount
    if (s.billingCycle === "YEARLY") return sum + s.amount / 12
    return sum
  }, 0)
  const yearlyTotal = activeSubscriptions.reduce((sum, s) => {
    if (s.billingCycle === "YEARLY") return sum + s.amount
    if (s.billingCycle === "MONTHLY") return sum + s.amount * 12
    return sum
  }, 0)

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
          <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
          <p className="text-slate-500">Manage software and service subscriptions</p>
        </div>
        <div className="flex items-center gap-4">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Subscription
          </Button>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Subscription" : "Add Subscription"}</DialogTitle>
              <DialogDescription>{editingId ? "Update subscription details" : "Track a new subscription service"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., ChatGPT Plus"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="sub-billingCycle">Billing Cycle</Label>
                  <Select
                    value={formData.billingCycle}
                    onValueChange={(value) => setFormData({ ...formData, billingCycle: value })}
                  >
                    <SelectTrigger id="sub-billingCycle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="sub-category">
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
                <Label htmlFor="nextBillingDate">Next Billing Date</Label>
                <Input
                  id="nextBillingDate"
                  type="date"
                  value={formData.nextBillingDate}
                  onChange={(e) => setFormData({ ...formData, nextBillingDate: e.target.value })}
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
                  rows={2}
                />
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
                    "Add Subscription"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-violet-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Monthly Cost</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(monthlyTotal)}</p>
                <p className="text-xs text-slate-400 mt-1">per month</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <RefreshCcw className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Yearly Cost</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(yearlyTotal)}</p>
                <p className="text-xs text-slate-400 mt-1">per year</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active Subscriptions</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{activeSubscriptions.length}</p>
                <p className="text-xs text-slate-400 mt-1">services</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">All Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No subscriptions added yet</p>
              <p className="text-sm text-slate-400">Add your first subscription to track costs</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${categoryConfig[subscription.category]?.color}20` }}
                    >
                      <span style={{ color: categoryConfig[subscription.category]?.color }}>
                        {categoryConfig[subscription.category]?.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{subscription.name}</h3>
                      <p className="text-xs text-slate-500 truncate">
                        {subscription.description || categoryConfig[subscription.category]?.label}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-900">
                        {formatCurrency(subscription.amount)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {subscription.billingCycle === "MONTHLY" ? "/month" : "/year"}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={subscription.status === "ACTIVE" ? "success" : "secondary"}>
                        {subscription.status}
                      </Badge>
                      <p className="text-xs text-slate-400 mt-1">
                        Next: {formatDate(subscription.nextBillingDate)}
                      </p>
                    </div>
                    <div className="ml-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(subscription)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(subscription.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
