import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Video, CheckCircle, Shield, TrendingUp } from "lucide-react"
import { TeamManagement } from "./TeamManagement"

export const dynamic = "force-dynamic"

export default async function TeamPage() {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          videos: true,
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "ADMIN":
        return {
          label: "Admin",
          color: "bg-gradient-to-r from-violet-500 to-purple-600",
          icon: <Shield className="w-4 h-4" />,
        }
      case "EDITOR":
        return {
          label: "Editor",
          color: "bg-gradient-to-r from-blue-500 to-cyan-500",
          icon: <Video className="w-4 h-4" />,
        }
      case "SOCIAL_MANAGER":
        return {
          label: "Social Manager",
          color: "bg-gradient-to-r from-emerald-500 to-green-500",
          icon: <CheckCircle className="w-4 h-4" />,
        }
      case "INVESTOR":
        return {
          label: "Investor",
          color: "bg-gradient-to-r from-amber-500 to-orange-500",
          icon: <TrendingUp className="w-4 h-4" />,
        }
      default:
        return {
          label: role,
          color: "bg-slate-500",
          icon: <Users className="w-4 h-4" />,
        }
    }
  }

  const usersByRole = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Team</h1>
        <p className="text-slate-500">Manage your team members</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-violet-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Members</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{users.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        {Object.entries(usersByRole).map(([role, count]) => {
          const config = getRoleConfig(role)
          return (
            <Card key={role} className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{config.label}s</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{count}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center text-white`}>
                    {config.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Team Management (List + Actions) */}
      <TeamManagement initialUsers={users} />
    </div>
  )
}
