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

        const { filename, fileType } = await request.json()

        if (!filename || !fileType) {
            return NextResponse.json({ error: "Missing filename or fileType" }, { status: 400 })
        }

        // Generate unique filename
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 8)
        const extension = filename.split(".").pop()
        const uniqueFilename = `voice_${timestamp}_${randomString}.${extension}`

        // Create Signed Upload URL
        // Using 'receipts' bucket since it is known to exist.

        const { data: signedData, error: signedError } = await supabase
            .storage
            .from('receipts')
            .createSignedUploadUrl(uniqueFilename)

        if (signedError) {
            console.error("Error creating signed url for voice:", signedError)
            return NextResponse.json({ error: "Storage bucket issue." }, { status: 500 })
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from("receipts")
            .getPublicUrl(uniqueFilename)

        return NextResponse.json({
            signedUrl: signedData.signedUrl,
            publicUrl,
            path: uniqueFilename
        })

    } catch (error: any) {
        console.error("Upload error details:", error)
        return NextResponse.json(
            { error: error.message || "Failed to initiate upload" },
            { status: 500 }
        )
    }
}
