"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatDate } from "@/lib/utils"
import {
  Video,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Send,
  Filter,
  X,
} from "lucide-react"

interface VideoType {
  id: string
  title: string
  description: string | null
  googleDriveUrl: string
  status: string
  publishedUrl: string | null
  publishedAt: string | null
  createdAt: string
  uploadedBy: {
    name: string
    email: string
  }
}

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "PUBLISHED" | "REJECTED"
type TimeFilter = "ALL" | "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM"

const statusTabs: { key: StatusFilter; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "ALL", label: "All", icon: <Video className="w-4 h-4" />, color: "violet" },
  { key: "PENDING", label: "Pending", icon: <Clock className="w-4 h-4" />, color: "amber" },
  { key: "APPROVED", label: "Approved", icon: <CheckCircle className="w-4 h-4" />, color: "emerald" },
  { key: "PUBLISHED", label: "Published", icon: <Send className="w-4 h-4" />, color: "blue" },
  { key: "REJECTED", label: "Rejected", icon: <XCircle className="w-4 h-4" />, color: "red" },
]

const timeFilters: { key: TimeFilter; label: string }[] = [
  { key: "ALL", label: "All Time" },
  { key: "TODAY", label: "Today" },
  { key: "YESTERDAY", label: "Yesterday" },
  { key: "THIS_WEEK", label: "This Week" },
  { key: "THIS_MONTH", label: "This Month" },
  { key: "CUSTOM", label: "Custom" },
]

export default function AllVideosPage() {
  const [videos, setVideos] = useState<VideoType[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("ALL")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [showCustomDate, setShowCustomDate] = useState(false)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/videos")
      const data = await res.json()
      setVideos(data)
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      setLoading(false)
    }
  }

  const isWithinTimeFilter = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    switch (timeFilter) {
      case "TODAY":
        return date >= today
      case "YESTERDAY":
        const dayAfterYesterday = new Date(yesterday)
        dayAfterYesterday.setDate(dayAfterYesterday.getDate() + 1)
        return date >= yesterday && date < dayAfterYesterday
      case "THIS_WEEK":
        const weekStart = new Date(today)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        return date >= weekStart
      case "THIS_MONTH":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        return date >= monthStart
      case "CUSTOM":
        if (!customStartDate && !customEndDate) return true
        const start = customStartDate ? new Date(customStartDate) : new Date(0)
        const end = customEndDate ? new Date(customEndDate + "T23:59:59") : new Date()
        return date >= start && date <= end
      default:
        return true
    }
  }

  const filteredVideos = videos.filter((v) => {
    const statusMatch = statusFilter === "ALL" || v.status === statusFilter
    const timeMatch = isWithinTimeFilter(v.createdAt)
    return statusMatch && timeMatch
  })

  const getCounts = () => {
    const timeFiltered = videos.filter((v) => isWithinTimeFilter(v.createdAt))
    return {
      all: timeFiltered.length,
      pending: timeFiltered.filter((v) => v.status === "PENDING").length,
      approved: timeFiltered.filter((v) => v.status === "APPROVED").length,
      published: timeFiltered.filter((v) => v.status === "PUBLISHED").length,
      rejected: timeFiltered.filter((v) => v.status === "REJECTED").length,
    }
  }

  const counts = getCounts()

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

  const handleTimeFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter)
    if (filter === "CUSTOM") {
      setShowCustomDate(true)
    } else {
      setShowCustomDate(false)
      setCustomStartDate("")
      setCustomEndDate("")
    }
  }

  const clearFilters = () => {
    setStatusFilter("ALL")
    setTimeFilter("ALL")
    setCustomStartDate("")
    setCustomEndDate("")
    setShowCustomDate(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-2" />
          <div className="h-4 bg-slate-200 rounded w-64" />
        </div>
        <div className="grid gap-4">
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
          <h1 className="text-2xl font-bold text-slate-900">All Videos</h1>
          <p className="text-slate-500">Overview of all videos in the system</p>
        </div>
        {(statusFilter !== "ALL" || timeFilter !== "ALL") && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Time Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 mr-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Time:</span>
        </div>
        {timeFilters.map((filter) => (
          <Button
            key={filter.key}
            variant={timeFilter === filter.key ? "default" : "outline"}
            size="sm"
            onClick={() => handleTimeFilterChange(filter.key)}
            className={timeFilter === filter.key ? "bg-violet-600 hover:bg-violet-700" : ""}
          >
            {filter.label}
          </Button>
        ))}
        
        {showCustomDate && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="ml-2">
                <Filter className="w-4 h-4 mr-2" />
                {customStartDate || customEndDate
                  ? `${customStartDate || "Start"} - ${customEndDate || "End"}`
                  : "Set Dates"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl">
        {statusTabs.map((tab) => {
          const count = tab.key === "ALL" ? counts.all :
            tab.key === "PENDING" ? counts.pending :
            tab.key === "APPROVED" ? counts.approved :
            tab.key === "PUBLISHED" ? counts.published :
            counts.rejected
          
          const isActive = statusFilter === tab.key
          
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? `bg-white shadow-md text-${tab.color}-600`
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <span className={isActive ? `text-${tab.color}-600` : "text-slate-400"}>
                {tab.icon}
              </span>
              {tab.label}
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  isActive
                    ? `bg-${tab.color}-100 text-${tab.color}-700`
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className={`border-0 shadow-sm ${statusFilter === "ALL" ? "ring-2 ring-violet-500" : ""}`}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-violet-600">{counts.all}</p>
            <p className="text-xs text-slate-500">Total</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm ${statusFilter === "PENDING" ? "ring-2 ring-amber-500" : ""}`}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{counts.pending}</p>
            <p className="text-xs text-slate-500">Pending</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm ${statusFilter === "APPROVED" ? "ring-2 ring-emerald-500" : ""}`}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{counts.approved}</p>
            <p className="text-xs text-slate-500">Approved</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm ${statusFilter === "PUBLISHED" ? "ring-2 ring-blue-500" : ""}`}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{counts.published}</p>
            <p className="text-xs text-slate-500">Published</p>
          </CardContent>
        </Card>
        <Card className={`border-0 shadow-sm ${statusFilter === "REJECTED" ? "ring-2 ring-red-500" : ""}`}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{counts.rejected}</p>
            <p className="text-xs text-slate-500">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Videos List */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>
              {statusFilter === "ALL" ? "All Videos" : `${statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()} Videos`}
              {timeFilter !== "ALL" && (
                <span className="text-sm font-normal text-slate-500 ml-2">
                  ({timeFilter === "CUSTOM" 
                    ? `${customStartDate || "Start"} to ${customEndDate || "End"}`
                    : timeFilter.replace("_", " ").toLowerCase()})
                </span>
              )}
            </span>
            <span className="text-sm font-normal text-slate-500">
              {filteredVideos.length} video{filteredVideos.length !== 1 ? "s" : ""}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredVideos.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">No videos found</p>
              <p className="text-sm text-slate-400">
                Try adjusting your filters or time range
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{video.title}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <User className="w-3 h-3" />
                      <span>{video.uploadedBy.name}</span>
                      <span>•</span>
                      <span>{formatDate(video.createdAt)}</span>
                      {video.publishedAt && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600">Published {formatDate(video.publishedAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(video.status)}
                    {video.publishedUrl && (
                      <a
                        href={video.publishedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View published video"
                      >
                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                          <Send className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    <a
                      href={video.googleDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View in Google Drive"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
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
