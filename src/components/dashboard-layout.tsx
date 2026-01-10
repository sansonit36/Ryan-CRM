"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/utils"
import {
  LayoutDashboard,
  Video,
  CheckCircle,
  DollarSign,
  Users,
  Settings,
  LogOut,
  TrendingUp,
  CreditCard,
  FileText,
  Menu,
  X,
  Send,
  BookOpen,
  MessageSquare,
} from "lucide-react"
import { useState } from "react"

const roleNavItems = {
  ADMIN: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/dashboard/videos", label: "All Videos", icon: Video },
    { href: "/dashboard/review", label: "Pending Review", icon: CheckCircle },
    { href: "/dashboard/published", label: "Published", icon: Send },
    { href: "/dashboard/expenses", label: "Expenses", icon: DollarSign },
    { href: "/dashboard/salaries", label: "Salaries", icon: CreditCard },
    { href: "/dashboard/subscriptions", label: "Subscriptions", icon: FileText },
    { href: "/dashboard/chat", label: "Team Chat", icon: MessageSquare },
    { href: "/dashboard/team", label: "Team", icon: Users },
  ],
  EDITOR: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/dashboard/my-videos", label: "My Videos", icon: Video },
    { href: "/dashboard/videos", label: "All Videos", icon: Video },
    { href: "/dashboard/published", label: "Published", icon: Send },
    { href: "/dashboard/upload", label: "Upload Video", icon: Video },
    { href: "/dashboard/chat", label: "Team Chat", icon: MessageSquare },
  ],
  SOCIAL_MANAGER: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/dashboard/review", label: "Review Videos", icon: CheckCircle },
    { href: "/dashboard/published", label: "Published", icon: Send },
    { href: "/dashboard/chat", label: "Team Chat", icon: MessageSquare },
  ],
  INVESTOR: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/dashboard/videos", label: "All Videos", icon: Video },
    { href: "/dashboard/review", label: "Pending Review", icon: CheckCircle },
    { href: "/dashboard/published", label: "Published", icon: Send },
    { href: "/dashboard/expenses", label: "Expenses", icon: DollarSign },
    { href: "/dashboard/salaries", label: "Salaries", icon: CreditCard },
    { href: "/dashboard/subscriptions", label: "Subscriptions", icon: FileText },
    { href: "/dashboard/chat", label: "Team Chat", icon: MessageSquare },
    { href: "/dashboard/team", label: "Team", icon: Users },
  ],
}

import { OnboardingTutorial } from "@/components/onboarding-tutorial"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)

  const userRole = (session?.user?.role || "EDITOR") as keyof typeof roleNavItems
  const navItems = roleNavItems[userRole] || roleNavItems.EDITOR

  // ... (helpers)
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-gradient-to-r from-violet-500 to-purple-600"
      case "EDITOR":
        return "bg-gradient-to-r from-blue-500 to-cyan-500"
      case "SOCIAL_MANAGER":
        return "bg-gradient-to-r from-emerald-500 to-green-500"
      case "INVESTOR":
        return "bg-gradient-to-r from-amber-500 to-orange-500"
      default:
        return "bg-slate-500"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Admin"
      case "EDITOR":
        return "Editor"
      case "SOCIAL_MANAGER":
        return "Social Manager"
      case "INVESTOR":
        return "Investor"
      default:
        return role
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      <OnboardingTutorial manualOpen={showTutorial} onOpenChange={setShowTutorial} />

      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white shadow-lg"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-72 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-100">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900">Ryan CRM</h1>
                <p className="text-xs text-slate-500">Content Management</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
              <Avatar className="h-10 w-10">
                <AvatarImage src={session?.user?.image || undefined} />
                <AvatarFallback>{getInitials(session?.user?.name || "U")}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {session?.user?.name || "User"}
                </p>
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white",
                    getRoleBadgeColor(userRole)
                  )}
                >
                  {getRoleLabel(userRole)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full justify-start text-xs h-9"
                onClick={() => setShowTutorial(true)}
              >
                <BookOpen className="w-3.5 h-3.5 mr-2" />
                Tutorial
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-xs h-9 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-72">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
