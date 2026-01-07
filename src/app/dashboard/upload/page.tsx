"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Video, Link as LinkIcon, FileText, Upload, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function UploadVideoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    googleDriveUrl: "",
    thumbnailUrl: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push("/dashboard/my-videos")
        router.refresh()
      }
    } catch (error) {
      console.error("Error uploading video:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/my-videos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Upload New Video</h1>
          <p className="text-slate-500">Add your video details and Google Drive link</p>
        </div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Video Details</CardTitle>
              <CardDescription>Fill in the information about your video</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <Video className="w-4 h-4 text-slate-400" />
                Video Title
              </Label>
              <Input
                id="title"
                placeholder="Enter video title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Enter video description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="googleDriveUrl" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-slate-400" />
                Google Drive URL
              </Label>
              <Input
                id="googleDriveUrl"
                type="url"
                placeholder="https://drive.google.com/..."
                value={formData.googleDriveUrl}
                onChange={(e) => setFormData({ ...formData, googleDriveUrl: e.target.value })}
                required
              />
              <p className="text-xs text-slate-500">
                Paste the shareable link from Google Drive
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-slate-400" />
                Thumbnail URL (Optional)
              </Label>
              <Input
                id="thumbnailUrl"
                type="url"
                placeholder="https://..."
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Video
                  </>
                )}
              </Button>
              <Link href="/dashboard/my-videos">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
