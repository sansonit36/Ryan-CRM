"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate } from "@/lib/utils"
import {
  Video,
  ExternalLink,
  CheckCircle,
  User,
  Link as LinkIcon,
  Calendar,
  Loader2,
  Globe,
  Youtube,
  Facebook,
  Instagram,
  Trash2,
  Eye,
  Plus,
} from "lucide-react"

// Custom icons for missing ones
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
)

interface SocialPost {
  id: string
  platform: string
  url: string
  views: number
  postedAt: string
}

interface VideoType {
  id: string
  title: string
  description: string | null
  googleDriveUrl: string
  status: string
  socialPosts: SocialPost[]
  createdAt: string
  uploadedBy: {
    name: string
  }
}

const PLATFORMS = [
  { value: "YOUTUBE", label: "YouTube", icon: Youtube },
  { value: "TIKTOK", label: "TikTok", icon: TikTokIcon },
  { value: "FACEBOOK", label: "Facebook", icon: Facebook },
  { value: "INSTAGRAM", label: "Instagram", icon: Instagram },
  { value: "SNAPCHAT", label: "Snapchat", icon: Globe }, // Lucide doesn't have Snapchat
  { value: "OTHER", label: "Other", icon: LinkIcon },
]

export default function PublishedVideosPage() {
  const { data: session } = useSession()
  const [videos, setVideos] = useState<VideoType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null)

  // Form state
  const [platform, setPlatform] = useState("YOUTUBE")
  const [url, setUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [refreshingStats, setRefreshingStats] = useState(false)

  const canManageLinks = session?.user?.role === "ADMIN" || session?.user?.role === "SOCIAL_MANAGER" || session?.user?.role === "INVESTOR"

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/videos")
      const data = await res.json()
      // Filter for actionable videos (Approved or Published)
      const approvedVideos = data.filter(
        (v: VideoType) => v.status === "APPROVED" || v.status === "PUBLISHED"
      )
      setVideos(approvedVideos)
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshStats = async () => {
    setRefreshingStats(true)
    try {
      await fetch("/api/cron/stats", { method: "POST" })
      await fetchVideos()
    } catch (error) {
      console.error("Error refreshing stats:", error)
    } finally {
      setRefreshingStats(false)
    }
  }

  const handleAddLink = async () => {
    if (!selectedVideo || !url) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/videos/${selectedVideo.id}/social`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, url }),
      })

      if (res.ok) {
        await fetchVideos() // Refresh to get updated list
        setUrl("") // Clear input but keep dialog open to add more
      }
    } catch (error) {
      console.error("Error adding link:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteLink = async (postId: string) => {
    if (!selectedVideo) return

    // Optimistic update
    const updatedVideos = videos.map(v => {
      if (v.id === selectedVideo.id) {
        return { ...v, socialPosts: v.socialPosts.filter(p => p.id !== postId) }
      }
      return v
    })
    setVideos(updatedVideos)

    try {
      await fetch(`/api/videos/${selectedVideo.id}/social?postId=${postId}`, {
        method: "DELETE",
      })
      await fetchVideos() // Sync with server
    } catch (error) {
      console.error("Error deleting link:", error)
      fetchVideos() // Revert on error
    }
  }

  const openManageDialog = (video: VideoType) => {
    setSelectedVideo(video)
    setPlatform("YOUTUBE")
    setUrl("")
  }

  const getPlatformIcon = (platform: string) => {
    const p = PLATFORMS.find(p => p.value === platform)
    const Icon = p ? p.icon : LinkIcon
    return <Icon className="w-4 h-4" />
  }

  const getTotalViews = (video: VideoType) => {
    return video.socialPosts?.reduce((sum, post) => sum + post.views, 0) || 0
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

  const publishedCount = videos.filter(v => v.status === "PUBLISHED").length
  const approvedCount = videos.filter(v => v.status === "APPROVED").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Published Videos</h1>
          <p className="text-slate-500">Manage social media posts and track performance</p>
        </div>
        <Button
          variant="outline"
          onClick={refreshStats}
          disabled={refreshingStats}
          className="gap-2"
        >
          {refreshingStats ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          Refresh Stats
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-r from-emerald-50 to-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{approvedCount}</p>
                <p className="text-sm text-slate-500">Approved (awaiting publish)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-r from-violet-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{publishedCount}</p>
                <p className="text-sm text-slate-500">Partially or fully published</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Videos List */}
      {videos.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No videos ready yet</h3>
            <p className="text-slate-500">Once videos are approved, they will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="border-0 shadow-lg hover:shadow-xl transition-all group">
              <CardContent className="p-0">
                <div className="aspect-video bg-gradient-to-br from-violet-500 to-indigo-600 rounded-t-2xl flex items-center justify-center relative">
                  <Video className="w-12 h-12 text-white/50" />
                  {video.status === "PUBLISHED" && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-green-500 text-white">Published</Badge>
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1.5 text-white text-xs">
                    <Eye className="w-3 h-3" />
                    {getTotalViews(video).toLocaleString()} views
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900 truncate flex-1">{video.title}</h3>
                  </div>

                  {/* Social Links Preview */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {video.socialPosts?.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No links added yet</span>
                    ) : (
                      video.socialPosts.map(post => {
                        const Icon = getPlatformIcon(post.platform)
                        return (
                          <a
                            key={post.id}
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            title={`${post.platform}: ${post.views} views`}
                          >
                            {Icon}
                          </a>
                        )
                      })
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-slate-400 mb-4">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{video.uploadedBy.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Uploaded: {formatDate(video.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={video.googleDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Drive
                      </Button>
                    </a>
                    {canManageLinks && (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => openManageDialog(video)}
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Manage Links
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Manage Links Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => {
        if (!open) {
          setSelectedVideo(null)
          setUrl("")
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Social Media Links</DialogTitle>
            <DialogDescription>
              Add or remove links where this video has been published.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Current Video Info */}
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="font-medium text-slate-900">{selectedVideo?.title}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {selectedVideo ? getTotalViews(selectedVideo).toLocaleString() : 0} total views</span>
              </div>
            </div>

            {/* Existing Links List */}
            <div className="space-y-3">
              <Label>Active Links</Label>
              {selectedVideo?.socialPosts && selectedVideo.socialPosts.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {selectedVideo.socialPosts.map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 rounded-full bg-slate-100">
                          {getPlatformIcon(post.platform)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                            {post.platform}
                          </p>
                          <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block max-w-[200px]">
                            {post.url}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {post.views.toLocaleString()} views
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteLink(post.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-sm text-slate-500">No social links added yet</p>
                </div>
              )}
            </div>

            {/* Add New Link Form */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <Label>Add New Link</Label>
              <div className="flex gap-3">
                <div className="w-[140px]">
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <div className="flex items-center gap-2">
                            <p.icon className="w-4 h-4" />
                            <span>{p.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="Paste URL here..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddLink} disabled={!url || submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedVideo(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
