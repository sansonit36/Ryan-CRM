"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VoiceRecorder } from "@/components/voice-recorder"
import { getInitials, formatDate } from "@/lib/utils" // Assumes formatDate matches needs or I might need relative time.
import { Send, Loader2, Mic } from "lucide-react"

interface Message {
    id: string
    content: string | null
    audioUrl: string | null
    createdAt: string
    sender: {
        id: string
        name: string
        avatar: string | null
    }
}

export default function ChatPage() {
    const { data: session } = useSession()
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [newMessage, setNewMessage] = useState("")
    const [sending, setSending] = useState(false)
    const [showRecorder, setShowRecorder] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const fetchMessages = async () => {
        try {
            const res = await fetch("/api/chat")
            if (res.ok) {
                const data = await res.json()
                setMessages(data)
            }
        } catch (error) {
            console.error("Error fetching messages:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMessages()
        const interval = setInterval(fetchMessages, 3000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const handleSend = async (audioUrl?: string) => {
        if (!newMessage.trim() && !audioUrl) return

        setSending(true)
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: newMessage || null,
                    audioUrl: audioUrl || null
                })
            })

            if (res.ok) {
                setNewMessage("")
                setShowRecorder(false)
                fetchMessages()
            }
        } catch (error) {
            console.error("Error sending message:", error)
        } finally {
            setSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    if (loading && messages.length === 0) {
        return (
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 rounded-xl bg-slate-50 border border-slate-200 shadow-inner mb-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        const isMe = message.sender.id === session?.user?.id
                        return (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                            >
                                <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarImage src={message.sender.avatar || undefined} />
                                    <AvatarFallback>{getInitials(message.sender.name)}</AvatarFallback>
                                </Avatar>
                                <div
                                    className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <span className="text-xs font-medium text-slate-600">
                                            {isMe ? "You" : message.sender.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div
                                        className={`p-3 rounded-2xl ${isMe
                                                ? "bg-violet-600 text-white rounded-tr-none"
                                                : "bg-white border border-slate-200 shadow-sm rounded-tl-none"
                                            }`}
                                    >
                                        {message.content && (
                                            <p className={`whitespace-pre-wrap text-sm ${isMe ? "text-white" : "text-slate-800"}`}>
                                                {message.content}
                                            </p>
                                        )}
                                        {message.audioUrl && (
                                            <div className={`mt-1 ${message.content ? "pt-2 border-t " + (isMe ? "border-violet-500" : "border-slate-100") : ""}`}>
                                                <audio controls src={message.audioUrl} className="h-8 max-w-[240px]" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={scrollRef} />
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-lg">
                {showRecorder ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700">Record Voice Note</p>
                            <Button variant="ghost" size="sm" onClick={() => setShowRecorder(false)}>Cancel</Button>
                        </div>
                        <VoiceRecorder onRecordingComplete={(url) => handleSend(url)} />
                    </div>
                ) : (
                    <div className="flex items-end gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-500 hover:text-violet-600 hover:bg-violet-50"
                            onClick={() => setShowRecorder(true)}
                        >
                            <Mic className="w-5 h-5" />
                        </Button>
                        <Input
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                        />
                        <Button
                            onClick={() => handleSend()}
                            disabled={!newMessage.trim() || sending}
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
