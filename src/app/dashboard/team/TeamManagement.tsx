"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Users, Video, CheckCircle, Shield, TrendingUp, MoreHorizontal, Key, Plus, Loader2 } from "lucide-react"

interface UserWithCounts {
    id: string
    name: string
    email: string
    role: string
    _count: {
        videos: number
        reviews: number
    }
}

interface TeamManagementProps {
    initialUsers: UserWithCounts[]
    currentUserRole?: string
}

export function TeamManagement({ initialUsers, currentUserRole }: TeamManagementProps) {
    const router = useRouter()
    const [users, setUsers] = useState<UserWithCounts[]>(initialUsers)
    const [isAddUserOpen, setIsAddUserOpen] = useState(false)
    const [isPasswordOpen, setIsPasswordOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Add User Form State
    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        password: "",
        role: "EDITOR",
    })

    // Change Password Form State
    const [newPassword, setNewPassword] = useState("")

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

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch("/api/team", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            })

            if (!res.ok) {
                const message = await res.text()
                alert(message)
                return
            }

            const createdUser = await res.json()

            // Optimistic update with empty counts
            const userWithCounts = {
                ...createdUser,
                _count: { videos: 0, reviews: 0 }
            }

            setUsers([userWithCounts, ...users])
            setIsAddUserOpen(false)
            setNewUser({ name: "", email: "", password: "", role: "EDITOR" })
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to create user")
        } finally {
            setIsLoading(false)
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedUserId) return
        setIsLoading(true)

        try {
            const res = await fetch(`/api/team/${selectedUserId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword }),
            })

            if (!res.ok) {
                const message = await res.text()
                alert(message)
                return
            }

            alert("Password updated successfully")
            setIsPasswordOpen(false)
            setNewPassword("")
            setSelectedUserId(null)
        } catch (error) {
            console.error(error)
            alert("Failed to update password")
        } finally {
            setIsLoading(false)
        }
    }

    const openPasswordDialog = (userId: string) => {
        setSelectedUserId(userId)
        setNewPassword("")
        setIsPasswordOpen(true)
    }

    const [isEditUserOpen, setIsEditUserOpen] = useState(false)
    const [userToEdit, setUserToEdit] = useState({ id: "", name: "", email: "", role: "EDITOR" })

    // ... (existing handlers)

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch(`/api/team/${userToEdit.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: userToEdit.name,
                    email: userToEdit.email,
                    role: userToEdit.role
                }),
            })

            if (!res.ok) throw new Error(await res.text())

            const updatedUser = await res.json()

            setUsers(users.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser, _count: u._count } : u)) // Keep counts
            setIsEditUserOpen(false)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to update user")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return
        setIsLoading(true)

        try {
            const res = await fetch(`/api/team/${userId}`, {
                method: "DELETE",
            })

            if (!res.ok) throw new Error(await res.text())

            setUsers(users.filter(u => u.id !== userId))
            router.refresh()
        } catch (error) {
            console.error(error)
            alert("Failed to delete user: " + (error as Error).message)
        } finally {
            setIsLoading(false)
        }
    }

    const openEditDialog = (user: UserWithCounts) => {
        setUserToEdit({ id: user.id, name: user.name, email: user.email, role: user.role })
        setIsEditUserOpen(true)
    }

    return (
        <>
            <Card className="border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-bold">All Team Members</CardTitle>
                    <Button onClick={() => setIsAddUserOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Member
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 mt-4">
                        {users.map((user) => {
                            const config = getRoleConfig(user.role)
                            return (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                                >
                                    <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center text-white font-semibold`}>
                                        {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900">{user.name}</p>
                                        <p className="text-sm text-slate-500">{user.email}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* ... (stats display) */}
                                        {user.role === "EDITOR" && (
                                            <div className="text-center hidden sm:block">
                                                <p className="text-lg font-bold text-slate-900">{user._count.videos}</p>
                                                <p className="text-xs text-slate-500">Videos</p>
                                            </div>
                                        )}
                                        {user.role === "SOCIAL_MANAGER" && (
                                            <div className="text-center hidden sm:block">
                                                <p className="text-lg font-bold text-slate-900">{user._count.reviews}</p>
                                                <p className="text-xs text-slate-500">Reviews</p>
                                            </div>
                                        )}
                                        <Badge className={`${config.color} text-white border-0 hidden sm:flex`}>
                                            {config.icon}
                                            <span className="ml-1">{config.label}</span>
                                        </Badge>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                                    Edit Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openPasswordDialog(user.id)}>
                                                    <Key className="mr-2 h-4 w-4" />
                                                    Change Password
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                >
                                                    Delete User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Add User Dialog */}
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Team Member</DialogTitle>
                        <DialogDescription>
                            Create a new account for your team member.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddUser} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={newUser.role}
                                onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="EDITOR">Editor</SelectItem>
                                    <SelectItem value="SOCIAL_MANAGER">Social Manager</SelectItem>
                                    <SelectItem value="INVESTOR">Investor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create User
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Team Member</DialogTitle>
                        <DialogDescription>
                            Update profile details.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditUser} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Full Name</Label>
                            <Input
                                id="edit-name"
                                value={userToEdit.name}
                                onChange={(e) => setUserToEdit({ ...userToEdit, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={userToEdit.email}
                                onChange={(e) => setUserToEdit({ ...userToEdit, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <Select
                                value={userToEdit.role}
                                onValueChange={(value) => setUserToEdit({ ...userToEdit, role: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="EDITOR">Editor</SelectItem>
                                    <SelectItem value="SOCIAL_MANAGER">Social Manager</SelectItem>
                                    <SelectItem value="INVESTOR">Investor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditUserOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Enter a new password for this user.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsPasswordOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Password
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
