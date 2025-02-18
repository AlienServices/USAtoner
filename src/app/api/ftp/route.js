import { FTP } from 'basic-ftp'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  const client = new FTP()
  const localPath = path.join(process.cwd(), 'public', 'data', 'ecatalog.csv')

  try {
    // Connect to FTP server using environment variables
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
    })

    // Download the file
    await client.downloadTo(localPath, process.env.FTP_FILE_PATH)
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "File downloaded successfully" 
    }))

  } catch (error) {
    console.error('FTP download error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Failed to download file" // Don't expose detailed error in production
    }), { status: 500 })
  } finally {
    client.close()
  }
} 