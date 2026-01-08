import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      console.error("Supabase URL is missing or placeholder")
      return NextResponse.json(
        { error: "Setup Error: Supabase Env Vars missing in Vercel. Please add NEXT_PUBLIC_SUPABASE_URL." },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 }
      )
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split(".").pop()
    const filename = `receipt_${timestamp}_${randomString}.${extension}`

    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { data, error } = await supabase
      .storage
      .from("receipts")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error("Supabase Storage Error:", error)
      return NextResponse.json({ error: "Storage upload failed" }, { status: 500 })
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from("receipts")
      .getPublicUrl(filename)

    return NextResponse.json({ url: publicUrl })

  } catch (error: any) {
    console.error("Upload error details:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload file due to server error" },
      { status: 500 }
    )
  }
}
