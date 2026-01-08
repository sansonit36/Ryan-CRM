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

    const { filename, fileType } = await request.json()

    if (!filename || !fileType) {
      return NextResponse.json({ error: "Missing filename or fileType" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const extension = filename.split(".").pop()
    const uniqueFilename = `receipt_${timestamp}_${randomString}.${extension}`

    // Create Signed Upload URL
    const { data: signedData, error: signedError } = await supabase
      .storage
      .from('receipts')
      .createSignedUploadUrl(uniqueFilename)

    if (signedError) {
      throw signedError
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from("receipts")
      .getPublicUrl(uniqueFilename)

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      publicUrl,
      path: uniqueFilename // Return path for reference if needed
    })

  } catch (error: any) {
    console.error("Upload error details:", error)
    return NextResponse.json(
      { error: error.message || "Failed to initiate upload due to server error" },
      { status: 500 }
    )
  }
}
