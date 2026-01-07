"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Video,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Activity,
  RefreshCw,
  Share2,
  Youtube,
  Facebook,
  Instagram,
  Ghost,
} from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts"

interface Stats {
  socialViews: number
  socialViewsByPlatform: Record<string, number>
  topSocialVideos: Array<{
    id: string
    title: string
    status: string
    totalViews: number
    platforms: Array<{ platform: string; views: number }>
  }>
  videos: {
    total: number
    pending: number
    approved: number
    rejected: number
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
}

const COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981"]

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  switch (platform) {
    case "YOUTUBE":
      return <Youtube className={className} />
    case "TIKTOK":
      return (
        <svg
          className={className}
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      )
    case "FACEBOOK":
      return <Facebook className={className} />
    case "INSTAGRAM":
      return <Instagram className={className} />
    case "SNAPCHAT":
      return <Ghost className={className} />
    default:
      return <Share2 className={className} />
  }
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState("all")

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/stats?timeRange=${timeRange}`)
      // if (!res.ok) throw new Error("Failed to fetch") // Optional: handle not ok
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      // Trigger mock update
      await fetch("/api/cron/stats", { method: "POST" })
      // Refetch stats
      await fetchStats()
    } catch (error) {
      console.error("Error refreshing stats:", error)
    } finally {
      setRefreshing(false)
    }
  }

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-2" />
          <div className="h-4 bg-slate-200 rounded w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const videoStatusData = stats
    ? [
      { name: "Pending", value: stats.videos.pending, color: "#f59e0b" },
      { name: "Approved", value: stats.videos.approved, color: "#10b981" },
      { name: "Rejected", value: stats.videos.rejected, color: "#ef4444" },
    ]
    : []

  const roleLabels: Record<string, string> = {
    ADMIN: "Admins",
    EDITOR: "Editors",
    SOCIAL_MANAGER: "Social Managers",
    INVESTOR: "Investors",
  }

  const teamData = stats?.team.byRole.map((r) => ({
    name: roleLabels[r.role] || r.role,
    count: r._count.role,
  })) || []

  const socialPlatformData = stats ? Object.entries(stats.socialViewsByPlatform).map(([name, value]) => ({
    name,
    value
  })) : []

  const approvalRate = stats
    ? stats.videos.total > 0
      ? ((stats.videos.approved / stats.videos.total) * 100).toFixed(1)
      : "0"
    : "0"

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Social Analytics</h1>
          <p className="text-slate-500">Track views and performance across platforms</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 3 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/30"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Fetching Views..." : "Fetch Latest Views"}
          </Button>
        </div>
      </div>

      {/* Main Stats Hero */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-0 shadow-xl bg-gradient-to-r from-violet-600 via-violet-600 to-indigo-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 p-32 bg-indigo-500/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <p className="text-violet-100 font-medium mb-2 flex items-center justify-center md:justify-start gap-2">
                  <Share2 className="w-5 h-5" />
                  Total Social Views
                </p>
                <h2 className="text-5xl md:text-7xl font-bold tracking-tight">
                  {stats?.socialViews.toLocaleString() || 0}
                </h2>
                <p className="text-violet-200 mt-4 text-lg">
                  Accumulated across {Object.keys(stats?.socialViewsByPlatform || {}).length} platforms
                </p>
              </div>

              <div className="flex gap-4">
                {/* Mini Cards for Platforms */}
                {socialPlatformData.map((platform) => (
                  <div key={platform.name} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center min-w-[100px]">
                    <div className="flex justify-center mb-2 text-white/80">
                      <PlatformIcon platform={platform.name} className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-xl">{platform.value.toLocaleString()}</p>
                    <p className="text-xs text-violet-200 capitalize">{platform.name.toLowerCase()}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Breakdown Chart */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Platform Performance</CardTitle>
            <CardDescription>Where your views are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={socialPlatformData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={80} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: any) => [value?.toLocaleString() || '0', 'Views']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                    {socialPlatformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Videos</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.videos.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Avg. Views / Video</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats?.topSocialVideos?.length
                      ? Math.round(stats.socialViews / stats.topSocialVideos.length).toLocaleString()
                      : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Video Performance List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Video Performance Report</CardTitle>
              <CardDescription>
                Top performing content {timeRange !== 'all' ? `(Last ${timeRange})` : '(All Time)'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!stats?.topSocialVideos?.length ? (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No views data yet</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-2">
                Click "Fetch Latest Views" to update stats from your social platforms or add links to your videos.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {stats?.topSocialVideos.map((video, idx) => (
                <div key={video.id} className="group flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`
                        w-8 h-8 flex items-center justify-center font-bold rounded-lg text-sm
                        ${idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}
                    `}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{video.title}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {video.platforms.map((p) => (
                          <span key={p.platform} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-sm">
                            <PlatformIcon platform={p.platform} className="w-3 h-3" />
                            {p.views.toLocaleString()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-8 md:w-auto w-full pt-4 md:pt-0 border-t md:border-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Total Views</p>
                      <p className="text-xl font-bold text-slate-900">{video.totalViews.toLocaleString()}</p>
                    </div>
                    <div className="md:hidden">
                      {/* Mobile spacer or action */}
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
