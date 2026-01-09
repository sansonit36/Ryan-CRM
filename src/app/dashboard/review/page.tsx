"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"
import {
  Video,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface VideoType {
  id: string
  title: string
  description: string | null
  googleDriveUrl: string
  status: string
  createdAt: string
  uploadedBy: {
    id: string
    name: string
    email: string
  }
}

export default function ReviewVideosPage() {
  const { data: session } = useSession()
  const [videos, setVideos] = useState<VideoType[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewingVideo, setReviewingVideo] = useState<VideoType | null>(null)
  const [reviewAction, setReviewAction] = useState<"APPROVED" | "REJECTED" | null>(null)
  const [feedback, setFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "name_asc" | "name_desc">("newest")
  const [selectedEditor, setSelectedEditor] = useState<string>("ALL")

  const canReview = session?.user?.role === "ADMIN" || session?.user?.role === "SOCIAL_MANAGER"

  // Calculate stats for unique editors
  const editorStats = videos.reduce((acc, video) => {
    const editorName = video.uploadedBy.name
    acc[editorName] = (acc[editorName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sortedEditors = Object.entries(editorStats).sort((a, b) => b[1] - a[1]) // Sort by count descending

  const filteredVideos = videos.filter((video) =>
    selectedEditor === "ALL" || video.uploadedBy.name === selectedEditor
  )

  const sortedVideos = [...filteredVideos].sort((a, b) => {
    switch (sortOrder) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case "name_asc":
        return a.uploadedBy.name.localeCompare(b.uploadedBy.name)
      case "name_desc":
        return b.uploadedBy.name.localeCompare(a.uploadedBy.name)
      default:
        return 0
    }
  })

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/videos")
      const data = await res.json()
      // Filter pending videos
      const pendingVideos = data.filter((v: VideoType) => v.status === "PENDING")
      setVideos(pendingVideos)
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async () => {
    if (!reviewingVideo || !reviewAction) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/videos/${reviewingVideo.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewAction,
          feedback: feedback || null,
        }),
      })

      if (res.ok) {
        setVideos(videos.filter((v) => v.id !== reviewingVideo.id))
        setReviewingVideo(null)
        setReviewAction(null)
        setFeedback("")
      }
    } catch (error) {
      console.error("Error reviewing video:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const openReviewDialog = (video: VideoType, action: "APPROVED" | "REJECTED") => {
    setReviewingVideo(video)
    setReviewAction(action)
    setFeedback("")
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
            <div key={i} className="h-40 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {canReview ? "Review Videos" : "Pending Videos"}
        </h1>
        <p className="text-slate-500">
          {canReview
            ? "Approve or reject videos submitted by editors"
            : "View videos pending review"}
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Editor Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedEditor("ALL")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedEditor === "ALL"
              ? "bg-violet-600 text-white shadow-md shadow-violet-200"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
          >
            All Editors
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${selectedEditor === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
              {videos.length}
            </span>
          </button>

          {sortedEditors.map(([name, count]) => (
            <button
              key={name}
              onClick={() => setSelectedEditor(name)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedEditor === name
                ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                }`}
            >
              {name}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${selectedEditor === name ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Sort Filter */}
        <div className="flex-shrink-0">
          <Select value={sortOrder} onValueChange={(val: any) => setSortOrder(val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name_asc">Editor (A-Z)</SelectItem>
              <SelectItem value="name_desc">Editor (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <Card className="border-0 shadow-md bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">{sortedVideos.length}</p>
              <p className="text-sm text-slate-500">
                {selectedEditor === "ALL" ? "Total pending review" : `Pending for ${selectedEditor}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Videos List */}
      {videos.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">All caught up!</h3>
            <p className="text-slate-500">No videos pending review</p>
          </CardContent>
        </Card>
      ) : sortedVideos.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No videos found</h3>
            <p className="text-slate-500">No pending videos for this editor</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedVideos.map((video) => (
            <Card key={video.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
                    <Video className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{video.title}</h3>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                    {video.description && (
                      <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {video.uploadedBy.name}
                      </span>
                      <span>Uploaded {formatDate(video.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <a
                      href={video.googleDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Watch Video
                      </Button>
                    </a>
                    {canReview && (
                      <div className="flex gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => openReviewDialog(video, "APPROVED")}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openReviewDialog(video, "REJECTED")}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewingVideo} onOpenChange={() => setReviewingVideo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "APPROVED" ? "Approve Video" : "Reject Video"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "APPROVED"
                ? "Confirm approval of this video"
                : "Please provide feedback for the editor"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-xl bg-slate-50 mb-4">
              <p className="font-medium text-slate-900">{reviewingVideo?.title}</p>
              <p className="text-sm text-slate-500">by {reviewingVideo?.uploadedBy.name}</p>
            </div>
            <Textarea
              placeholder={
                reviewAction === "APPROVED"
                  ? "Optional: Add a comment"
                  : "Provide feedback on what needs to be changed"
              }
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReviewingVideo(null)
                setFeedback("")
              }}
            >
              Cancel
            </Button>
            <Button
              variant={reviewAction === "APPROVED" ? "success" : "destructive"}
              onClick={handleReview}
              disabled={submitting || (reviewAction === "REJECTED" && !feedback)}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : reviewAction === "APPROVED" ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}
