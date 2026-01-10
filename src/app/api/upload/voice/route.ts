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
        // Using 'voice-notes' bucket. If it doesn't exist, this might fail or the client upload will fail.
        // For now, let's try 'voice-notes'.
        // NOTE: The user needs to create a public bucket named 'voice-notes' in Supabase.

        // Check if we should fallback to receipts (temporary hack if voice-notes isn't set up)
        // But better to enforce structure.

        const { data: signedData, error: signedError } = await supabase
            .storage
            .from('voice-notes')
            .createSignedUploadUrl(uniqueFilename)

        if (signedError) {
            // Fallback to receipts if voice-notes bucket doesn't exist?
            // It's risky to pollute receipts. I'll verify if I can catch this.
            // If the error is "Bucket not found", we should tell the user.
            console.error("Error creating signed url for voice-notes:", signedError)
            return NextResponse.json({ error: "Storage bucket issue. Please ensure 'voice-notes' bucket exists." }, { status: 500 })
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from("voice-notes")
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
