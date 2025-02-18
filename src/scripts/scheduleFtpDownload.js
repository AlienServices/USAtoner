import cron from 'node-cron'
import { FTP } from 'basic-ftp'
import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

cron.schedule('0 9 * * *', async () => {
  const client = new FTP()
  const localPath = path.join(process.cwd(), 'public', 'data', 'ecatalog.csv')

  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
    })

    await client.downloadTo(localPath, process.env.FTP_FILE_PATH)
    console.log('FTP download completed successfully')

  } catch (error) {
    console.error('FTP download error:', error)
  } finally {
    client.close()
  }
}) 