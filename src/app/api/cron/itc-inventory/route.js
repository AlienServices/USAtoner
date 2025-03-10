import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/itc-client';
import ftp from 'basic-ftp';
import csv from 'csv-parser';
import { Readable } from 'stream';

// Initialize Prisma client
const itcPrisma = new PrismaClient();

// Helper function to get FTP configuration
const getFTPConfig = () => ({
  host: process.env.ITC_FTP_HOST,
  user: process.env.ITC_FTP_USER,
  password: process.env.ITC_FTP_PASSWORD,
  port: parseInt(process.env.ITC_FTP_PORT || '21'),
  secure: process.env.ITC_FTP_SECURE === 'true'
});

// Function to verify CRON secret
const verifyCronSecret = (request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw new Error('Unauthorized: Invalid or missing CRON_SECRET');
  }
};

// Function to download and parse CSV file
async function downloadAndParseCSV(client, remotePath) {
  const chunks = [];
  await client.downloadTo(Readable.from(chunks), remotePath);
  
  const data = Buffer.concat(chunks).toString();
  const results = [];
  
  return new Promise((resolve, reject) => {
    Readable.from(data)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Function to update inventory in database
async function updateInventory(items) {
  console.log('Starting inventory update...');
  try {
    const updates = items.map(item => 
      itcPrisma.iTCInventory.upsert({
        where: { sku: item.sku },
        update: {
          description: item.description,
          price: parseFloat(item.price),
          quantity: parseInt(item.quantity),
          lastUpdated: new Date()
        },
        create: {
          sku: item.sku,
          description: item.description,
          price: parseFloat(item.price),
          quantity: parseInt(item.quantity),
          lastUpdated: new Date()
        }
      })
    );

    await itcPrisma.$transaction(updates);
    console.log(`Successfully updated ${items.length} items`);
    return items.length;
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
}

export async function GET(req) {
  console.log('Starting ITC inventory update process...');
  
  try {
    // Verify CRON secret
    verifyCronSecret(req);
    
    const config = getFTPConfig();
    const client = new ftp.Client();
    client.ftp.verbose = true; // Enable verbose logging
    
    try {
      // Connect to FTP server
      console.log('Connecting to FTP server...');
      await client.access({
        host: config.host,
        user: config.user,
        password: config.password,
        port: config.port,
        secure: config.secure
      });
      
      // Download and parse inventory file
      console.log('Downloading inventory file...');
      const items = await downloadAndParseCSV(client, process.env.ITC_FTP_FILE_PATH);
      
      // Update inventory in database
      const updatedCount = await updateInventory(items);
      
      return NextResponse.json({ 
        success: true, 
        data: {
          itemCount: updatedCount,
          message: 'Inventory updated successfully',
          timestamp: new Date().toISOString()
        }
      });
      
    } finally {
      // Always close the FTP connection
      client.close();
    }
    
  } catch (error) {
    console.error('Error in ITC inventory update:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: 'Check server logs for more information'
      },
      { status: error.response?.status || 500 }
    );
  }
} 