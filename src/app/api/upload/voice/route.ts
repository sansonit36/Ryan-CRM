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

        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = file.name || "voice-note.webm"
        const fileType = file.type || "audio/webm"

        // Generate unique filename
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 8)
        const extension = filename.split(".").pop() || "webm"
        const uniqueFilename = `voice_${timestamp}_${randomString}.${extension}`

        // Ensure bucket exists
        const bucketName = 'voice-notes'
        const { data: buckets } = await supabase.storage.listBuckets()
        const bucketExists = buckets?.some(b => b.name === bucketName)

        if (!bucketExists) {
            const { error: createError } = await supabase.storage.createBucket(bucketName, {
                public: true,
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg']
            })
            if (createError) {
                console.error("Error creating bucket:", createError)
                // Fallback to trying to upload (maybe list buckets failed but it exists?)
            }
        }

        // Upload to Supabase
        const { error: uploadError } = await supabase
            .storage
            .from(bucketName)
            .upload(uniqueFilename, buffer, {
                contentType: fileType,
                upsert: false
            })

        if (uploadError) {
            console.error("Error uploading voice note:", uploadError)
            return NextResponse.json({ error: "Upload failed: " + uploadError.message }, { status: 500 })
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from(bucketName)
            .getPublicUrl(uniqueFilename)

        return NextResponse.json({
            publicUrl,
            path: uniqueFilename
        })

    } catch (error: any) {
        console.error("Upload error details:", error)
        return NextResponse.json(
            { error: error.message || "Failed to process upload" },
            { status: 500 }
        )
    }
}
