import { FTP } from 'basic-ftp'
import fs from 'fs/promises'
import path from 'path'
import { processCatalog } from '@/utils/processToner.mjs'

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
    
    // Process and sort the catalog
    const sortedCatalog = await processCatalog()
    
    // Save sorted data to separate files
    for (const [brand, items] of Object.entries(sortedCatalog)) {
      await fs.writeFile(
        path.join(process.cwd(), 'public', 'data', `${brand}-catalog.json`),
        JSON.stringify(items, null, 2)
      )
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "File downloaded and processed successfully" 
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