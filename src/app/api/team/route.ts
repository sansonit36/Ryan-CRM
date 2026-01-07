import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "INVESTOR")) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { name, email, password, role } = await req.json()

        if (!name || !email || !password || !role) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return new NextResponse("User already exists", { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
            },
        })

        const { password: _, ...userWithoutPassword } = user

        return NextResponse.json(userWithoutPassword)
    } catch (error) {
        console.error("[TEAM_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
