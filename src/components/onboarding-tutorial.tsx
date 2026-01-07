
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    BookOpen,
    DollarSign,
    Users,
    Video,
    BarChart,
    CheckCircle,
    ArrowRight,
    Shield,
    Upload
} from "lucide-react"

type Role = "ADMIN" | "EDITOR" | "SOCIAL_MANAGER" | "INVESTOR"

const roleContent: Record<Role, { title: string; steps: { title: string; description: string; icon: any }[] }> = {
    ADMIN: {
        title: "Welcome Administrator",
        steps: [
            {
                title: "Complete Control",
                description: "You have full access to manage the entire CRM. From team management to financial oversight, you're in the driver's seat.",
                icon: Shield,
            },
            {
                title: "Financial Overview",
                description: "Track expenses, manage salaries, and monitor subscription costs in real-time from the Financials dashboard.",
                icon: DollarSign,
            },
            {
                title: "Content & Team",
                description: "Oversee the content pipeline, approve videos, and manage your team's access and roles.",
                icon: Users,
            },
        ],
    },
    EDITOR: {
        title: "Welcome Editor",
        steps: [
            {
                title: "Content Hub",
                description: "Your main workspace is the Videos section. Here you can upload new edits and track their approval status.",
                icon: Video,
            },
            {
                title: "Upload & Review",
                description: "Upload your latest cuts directly to the platform. You'll be notified when an Admin reviews your work.",
                icon: Upload,
            },
            {
                title: "Track Progress",
                description: "Keep an eye on the Dashboard to see which of your videos are published and performing well.",
                icon: BarChart,
            },
        ],
    },
    SOCIAL_MANAGER: {
        title: "Welcome Social Manager",
        steps: [
            {
                title: "Analytics Command Center",
                description: "Your focus is growth. Use the Analytics page to track views, engagement, and platform performance.",
                icon: BarChart,
            },
            {
                title: "Multi-Platform Tracking",
                description: "Monitor stats across YouTube, TikTok, and Facebook. Identify trends and top-performing content.",
                icon: Users,
            },
            {
                title: "Content Strategy",
                description: "Use the data to inform content strategy and maximize reach for every published video.",
                icon: Video,
            },
        ],
    },
    INVESTOR: {
        title: "Welcome Investor",
        steps: [
            {
                title: "Portfolio View",
                description: "Get a high-level view of the business health. Transparency is key, and you have access to core metrics.",
                icon: BarChart,
            },
            {
                title: "Financial Health",
                description: "Monitor run rates, expenses, and overall financial stability on the Financials page.",
                icon: DollarSign,
            },
            {
                title: "Growth Metrics",
                description: "Track user growth and content performance to see how the business is scaling.",
                icon: TrendingUp,
            },
        ],
    },
}

// Fallback for undefined roles
const defaultContent = roleContent.EDITOR

import { TrendingUp } from "lucide-react"

export function OnboardingTutorial({ manualOpen, onOpenChange }: { manualOpen?: boolean, onOpenChange?: (open: boolean) => void }) {
    const { data: session } = useSession()
    const [open, setOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    const role = (session?.user?.role as Role) || "EDITOR"
    const content = roleContent[role] || defaultContent

    useEffect(() => {
        if (manualOpen) {
            setOpen(true)
            setCurrentStep(0)
            return
        }

        if (session?.user?.email) {
            const hasSeen = localStorage.getItem(`ryan_crm_onboarding_seen_${session.user.email}`)
            if (!hasSeen) {
                setOpen(true)
            }
        }
    }, [session, manualOpen])

    useEffect(() => {
        if (onOpenChange) {
            onOpenChange(open)
        }
    }, [open, onOpenChange])

    const handleNext = () => {
        if (currentStep < content.steps.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            handleFinish()
        }
    }

    const handleFinish = () => {
        if (session?.user?.email) {
            localStorage.setItem(`ryan_crm_onboarding_seen_${session.user.email}`, "true")
        }
        setOpen(false)
        setTimeout(() => setCurrentStep(0), 300) // Reset after close animation
    }

    const StepIcon = content.steps[currentStep].icon

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleFinish()}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-2xl">
                <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-8 text-white text-center">
                    <div className="mx-auto bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-4">
                        <StepIcon className="w-8 h-8 text-white" />
                    </div>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-white mb-2">
                        {content.steps[currentStep].title}
                    </DialogTitle>
                    <DialogDescription className="text-violet-100 text-base max-w-[80%] mx-auto">
                        {content.steps[currentStep].description}
                    </DialogDescription>
                </div>

                <div className="p-6 bg-white space-y-6">
                    <div className="flex justify-center gap-2">
                        {content.steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? "w-8 bg-violet-600" : "w-1.5 bg-slate-200"
                                    }`}
                            />
                        ))}
                    </div>

                    <DialogFooter className="flex-row gap-2 sm:justify-between">
                        <Button
                            variant="ghost"
                            onClick={handleFinish}
                            className="text-slate-500 hover:text-slate-900"
                        >
                            Skip
                        </Button>
                        <Button
                            onClick={handleNext}
                            className="bg-violet-600 hover:bg-violet-700 text-white min-w-[100px]"
                        >
                            {currentStep === content.steps.length - 1 ? (
                                <span className="flex items-center gap-2">
                                    Get Started <CheckCircle className="w-4 h-4" />
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Next <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
