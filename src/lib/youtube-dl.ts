
import { execFile } from "child_process"
import path from "path"

const YT_DLP_PATH = path.join(process.cwd(), "src/bin/yt-dlp")

export async function fetchWithYtDlp(url: string): Promise<{ views: number | null }> {
    return new Promise((resolve, reject) => {
        execFile(YT_DLP_PATH, ["--dump-json", url, "--no-warnings"], { timeout: 30000 }, (error, stdout, stderr) => {
            if (error) {
                console.error("yt-dlp error:", stderr || error.message)
                return resolve({ views: null }) // Resolve with null to allow fallback
            }

            try {
                const data = JSON.parse(stdout)
                const viewCount = data.view_count || null
                resolve({ views: viewCount })
            } catch (e) {
                console.error("yt-dlp parse error:", e)
                resolve({ views: null })
            }
        })
    })
}
