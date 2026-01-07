import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "INVESTOR")) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { id } = await params
        const { name, email, role, password } = await req.json()

        const updateData: any = {}
        if (name) updateData.name = name
        if (email) updateData.email = email
        if (role) updateData.role = role
        if (password) {
            updateData.password = await bcrypt.hash(password, 10)
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
        })

        const { password: _, ...userWithoutPassword } = user

        return NextResponse.json(userWithoutPassword)
    } catch (error) {
        console.error("[TEAM_PATCH]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { id } = await params

        // Prevent deleting yourself
        if (session.user.email) {
            const currentUser = await prisma.user.findUnique({ where: { email: session.user.email } })
            if (currentUser?.id === id) {
                return new NextResponse("Cannot delete your own account", { status: 400 })
            }
        }

        await prisma.user.delete({
            where: { id },
        })

        return new NextResponse("User deleted", { status: 200 })
    } catch (error) {
        console.error("[TEAM_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
