"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Play, Pause, Trash2, Upload, Loader2, RotateCcw } from "lucide-react"
import { toast } from "sonner"

export function VoiceRecorder({ onRecordingComplete }: { onRecordingComplete: (url: string) => void }) {
    const [isRecording, setIsRecording] = useState(false)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (audioUrl) URL.revokeObjectURL(audioUrl)
        }
    }, [audioUrl])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            const chunks: BlobPart[] = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data)
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: "audio/webm" })
                setAudioBlob(blob)
                setAudioUrl(URL.createObjectURL(blob))
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
            setRecordingTime(0)

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)

        } catch (error) {
            console.error("Error accessing microphone:", error)
            alert("Could not access microphone")
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    const togglePlayback = () => {
        if (!audioRef.current) return

        if (isPlaying) {
            audioRef.current.pause()
        } else {
            audioRef.current.play()
        }
        setIsPlaying(!isPlaying)
    }

    const resetRecording = () => {
        setAudioBlob(null)
        setAudioUrl(null)
        setIsPlaying(false)
        setRecordingTime(0)
    }

    const uploadRecording = async () => {
        if (!audioBlob) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", audioBlob, "voice-note.webm")

            const res = await fetch("/api/upload/voice", {
                method: "POST",
                body: formData
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to upload voice note")
            }

            // Callback with public URL
            onRecordingComplete(data.publicUrl)

        } catch (error) {
            console.error("Upload failed:", error)
            alert("Upload failed. Please try again.")
        } finally {
            setIsUploading(false)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="flex flex-col gap-3 p-4 border rounded-xl bg-slate-50">
            <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-500">
                    {isRecording ? "Recording..." : audioBlob ? "Voice Note Recorded" : "Record Voice Note"}
                </div>
                {(isRecording || audioBlob) && (
                    <div className="text-xs font-mono bg-slate-200 px-2 py-1 rounded">
                        {formatTime(recordingTime)}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                {!isRecording && !audioBlob && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full bg-white text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100"
                        onClick={startRecording}
                    >
                        <Mic className="w-4 h-4 mr-2" />
                        Start Recording
                    </Button>
                )}

                {isRecording && (
                    <Button
                        size="sm"
                        variant="destructive"
                        className="w-full animate-pulse"
                        onClick={stopRecording}
                    >
                        <Square className="w-4 h-4 mr-2" />
                        Stop Recording
                    </Button>
                )}

                {audioBlob && !isRecording && (
                    <>
                        <Button
                            size="icon"
                            variant="outline"
                            className="bg-white"
                            onClick={togglePlayback}
                        >
                            {isPlaying ? (
                                <Pause className="w-4 h-4 text-slate-600" />
                            ) : (
                                <Play className="w-4 h-4 text-slate-600" />
                            )}
                        </Button>

                        <audio
                            ref={audioRef}
                            src={audioUrl || ""}
                            onEnded={() => setIsPlaying(false)}
                            className="hidden"
                        />

                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-white text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-100"
                            onClick={uploadRecording}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Send Voice Note
                                </>
                            )}
                        </Button>

                        <Button
                            size="icon"
                            variant="ghost"
                            className="text-slate-400 hover:text-red-500"
                            onClick={resetRecording}
                            disabled={isUploading}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}
