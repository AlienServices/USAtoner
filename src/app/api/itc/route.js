import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/itc-client';
import * as ftp from 'basic-ftp';
import csv from 'csv-parser';
import { Readable, Writable } from 'stream';

// Initialize Prisma client
const itcPrisma = new PrismaClient();

// Helper function to get FTP configuration
const getFTPConfig = () => ({
  host: process.env.ITC_FTP_HOST,
  user: process.env.ITC_FTP_USER,
  password: process.env.ITC_FTP_PASSWORD,
  filePath: process.env.ITC_FTP_FILE_PATH
});

// Function to download and parse CSV file
async function downloadAndParseCSV(client) {
  console.log('Starting CSV download...');
  const chunks = [];
  
  // Create a writable stream to collect chunks
  const writableStream = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(chunk);
      callback();
    }
  });
  
  try {
    console.log(`Downloading file from: ${getFTPConfig().filePath}`);
    await client.downloadTo(writableStream, getFTPConfig().filePath);
    
    const fileContent = Buffer.concat(chunks).toString();
    console.log('File downloaded successfully');
    
    const items = [];
    await new Promise((resolve, reject) => {
      Readable.from(fileContent)
        .pipe(csv({
          separator: ',',
          headers: [
            'PartNo', 'MFGPartNo', 'Manufacturer', 'Description1', 'Description2',
            'COO', 'TAA', 'UnitPrice', 'ListPrice', 'TotalAvailable',
            'Whse1', 'Whse2', 'Whse3', 'Whse4', 'Whse5', 'Whse6',
            'UPC', 'UM', 'Yield', 'HseBrdOem', 'ImageName', 'Category',
            'MachSupply', 'Weight', 'length', 'width', 'height', 'MachMfc', 'Models'
          ],
          skipLines: 1
        }))
        .on('data', (data) => {
          if (data.PartNo !== 'PartNo') {
            items.push(data);
          }
        })
        .on('end', () => {
          console.log(`Parsed ${items.length} items from CSV`);
          resolve(items);
        })
        .on('error', (error) => {
          console.error('Error parsing CSV:', error);
          reject(error);
        });
    });
    
    return items;
  } catch (error) {
    console.error('Error downloading/parsing file:', error);
    throw error;
  }
}

// Function to update inventory in database
async function updateInventory(items) {
  console.log('Starting inventory update...');
  const updates = items.map(item => {
    const data = {
      sku: item.PartNo,
      description: `${item.Description1}${item.Description2 ? ' ' + item.Description2 : ''}`.trim(),
      price: parseFloat(item.UnitPrice) || 0,
      quantity: parseInt(item.TotalAvailable) || 0,
      lastUpdated: new Date(),
      manufacturerName: item.Manufacturer || '',
      mfgPartNumber: item.MFGPartNo || '',
      listPrice: parseFloat(item.ListPrice) || 0,
      upcCode: item.UPC || '',
      unitMeasure: item.UM || '',
      categoryName: item.Category || '',
      warehouse1Qty: parseInt(item.Whse1) || 0,
      warehouse2Qty: parseInt(item.Whse2) || 0,
      warehouse3Qty: parseInt(item.Whse3) || 0,
      warehouse4Qty: parseInt(item.Whse4) || 0,
      warehouse5Qty: parseInt(item.Whse5) || 0,
      warehouse6Qty: parseInt(item.Whse6) || 0
    };

    return itcPrisma.iTCInventory.upsert({
      where: { sku: item.PartNo },
      update: data,
      create: data
    });
  });

  console.log(`Processing ${updates.length} updates...`);
  const results = await itcPrisma.$transaction(updates);
  console.log('Database update completed');
  return results.length;
}

export async function GET() {
  console.log('Starting ITC inventory update process...');
  
  try {
    const config = getFTPConfig();
    const client = new ftp.Client();
    client.ftp.verbose = true;
    
    try {
      // Connect to FTP server
      console.log('Connecting to FTP server...');
      await client.access({
        host: config.host,
        user: config.user,
        password: config.password,
        secure: false
      });
      
      // Download and parse inventory file
      const items = await downloadAndParseCSV(client);
      
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
      client.close();
    }
    
  } catch (error) {
    console.error('Error in ITC inventory update:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: error.stack || 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
} 