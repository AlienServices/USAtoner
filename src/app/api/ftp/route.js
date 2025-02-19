import * as ftp from 'basic-ftp'
import fs from 'fs/promises'
import path from 'path'
import { processCatalog } from '@/utils/processToner'

// Add a timestamp check to avoid too frequent updates
let lastUpdate = 0
const UPDATE_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export async function GET() {
  const now = Date.now()
  
  // Only update if more than 24 hours have passed
  if (now - lastUpdate < UPDATE_INTERVAL) {
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Using cached data" 
    }))
  }

  const client = new ftp.Client()
  const localPath = path.join(process.cwd(), 'public', 'data', 'ecatalog.csv')

  try {
    // Connect to FTP server
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
    })

    // Download the file
    await client.downloadTo(localPath, process.env.FTP_FILE_PATH)
    
    // Process and sort the catalog
    const sortedCatalog = await processCatalog()
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'public', 'data')
    await fs.mkdir(dataDir, { recursive: true })
    
    // Save sorted data to separate files
    for (const [brand, items] of Object.entries(sortedCatalog)) {
      await fs.writeFile(
        path.join(dataDir, `${brand}-catalog.json`),
        JSON.stringify(items, null, 2)
      )
    }
    
    lastUpdate = now
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "File downloaded and processed successfully",
      brands: Object.keys(sortedCatalog)
    }))

  } catch (error) {
    console.error('FTP download error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Failed to process file" 
    }), { status: 500 })
  } finally {
    client.close()
  }
} 