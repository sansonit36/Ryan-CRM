"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import {
  Video,
  Plus,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react"

interface VideoType {
  id: string
  title: string
  description: string | null
  googleDriveUrl: string
  status: string
  createdAt: string
  reviews: Array<{
    status: string
    feedback: string | null
    reviewer: { name: string }
    createdAt: string
  }>
}

export default function MyVideosPage() {
  const { data: session } = useSession()
  const [videos, setVideos] = useState<VideoType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/videos")
      const data = await res.json()
      // Filter videos by current user
      const myVideos = data.filter((v: VideoType & { uploadedById: string }) => 
        v.uploadedById === session?.user?.id
      )
      setVideos(myVideos)
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4 text-amber-500" />
      case "APPROVED":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case "REJECTED":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="warning">Pending Review</Badge>
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
          <h1 className="text-2xl font-bold text-slate-900">My Videos</h1>
          <p className="text-slate-500">Manage your uploaded videos</p>
        </div>
        <Link href="/dashboard/upload">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Upload Video
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Video className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{videos.length}</p>
              <p className="text-xs text-slate-500">Total Videos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {videos.filter((v) => v.status === "PENDING").length}
              </p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {videos.filter((v) => v.status === "APPROVED").length}
              </p>
              <p className="text-xs text-slate-500">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {videos.filter((v) => v.status === "REJECTED").length}
              </p>
              <p className="text-xs text-slate-500">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Videos List */}
      {videos.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-violet-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No videos yet</h3>
            <p className="text-slate-500 mb-4">Upload your first video to get started</p>
            <Link href="/dashboard/upload">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <Card key={video.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-slate-900 truncate">
                          {video.title}
                        </h3>
                        {getStatusBadge(video.status)}
                      </div>
                      {video.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 mb-2">
                          {video.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>Uploaded {formatDate(video.createdAt)}</span>
                      </div>

                      {/* Show feedback if rejected */}
                      {video.status === "REJECTED" && video.reviews[0]?.feedback && (
                        <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100">
                          <div className="flex items-center gap-2 text-red-700 text-sm font-medium mb-1">
                            <MessageSquare className="w-4 h-4" />
                            Feedback from {video.reviews[0].reviewer.name}
                          </div>
                          <p className="text-sm text-red-600">{video.reviews[0].feedback}</p>
                        </div>
                      )}

                      {/* Show approval info */}
                      {video.status === "APPROVED" && video.reviews[0] && (
                        <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                          <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Approved by {video.reviews[0].reviewer.name}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <a
                    href={video.googleDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
