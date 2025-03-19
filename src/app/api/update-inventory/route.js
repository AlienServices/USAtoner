import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as ftp from 'basic-ftp';
import csv from 'csv-parser';
import { Readable, Writable } from 'stream';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath });

console.log("Server .env path:", envPath);

// Load CRON_SECRET directly from .env file
let CRON_SECRET = process.env.CRON_SECRET?.trim();
console.log("Server CRON_SECRET from env:", CRON_SECRET);

// If not available, try reading directly from .env file
if (!CRON_SECRET && fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/CRON_SECRET=["']?(.*?)["']?$/m);
    if (match && match[1]) {
      CRON_SECRET = match[1].trim();
      console.log("Server CRON_SECRET loaded from file:", CRON_SECRET);
    }
  } catch (error) {
    console.error("Error reading .env file:", error);
  }
}

// Initialize PrismaClient with better error handling
const prisma = new PrismaClient();

// Add this to handle any initialization errors
process.on('exit', async () => {
  await prisma.$disconnect();
});

// Helper function to get FTP configuration
const getFTPConfig = () => ({
  host: process.env.ITC_FTP_HOST,
  user: process.env.ITC_FTP_USER,
  password: process.env.ITC_FTP_PASSWORD,
  filePath: process.env.ITC_FTP_FILE_PATH
});

// Function to verify CRON secret
const verifyCronSecret = (request) => {
  const authHeader = request.headers.get('authorization');
  
  // Hardcoded secret for testing
  const SECRET = "USAtonerSecretKey12345678";
  const expectedAuth = `Bearer ${SECRET}`;
  
  console.log('===== CRON SECRET DEBUG =====');
  console.log('Received Header:', authHeader);
  console.log('Expected Header:', expectedAuth);
  
  if (!authHeader) {
    console.log('No Authorization header found');
    throw new Error('Unauthorized: Missing CRON_SECRET');
  }
  
  if (authHeader !== expectedAuth) {
    console.log('AUTHORIZATION MISMATCH');
    throw new Error('Unauthorized: Invalid CRON_SECRET');
  }
  
  console.log('Authorization successful');
};

// Function to download and parse CSV file
async function downloadAndParseCSV(client, filePath) {
  console.log('Starting CSV download...');
  const chunks = [];
  
  // Create a writable stream that collects chunks
  const writableStream = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(chunk);
      callback();
    }
  });
  
  try {
    console.log(`Downloading file from: ${filePath}`);
    await client.downloadTo(writableStream, filePath);
    
    const data = Buffer.concat(chunks).toString();
    console.log('File downloaded, first 200 characters:', data.substring(0, 200));
    
    const results = [];
    
    return new Promise((resolve, reject) => {
      Readable.from(data)
        .pipe(csv({
          // Add any specific CSV parsing options if needed
          separator: ',',
          headers: true,
          skipLines: 0
        }))
        .on('data', (row) => {
          // Log the first row to see the structure
          if (results.length === 0) {
            console.log('First CSV row structure:', row);
          }
          results.push(row);
        })
        .on('end', () => {
          console.log(`Parsed ${results.length} items from CSV`);
          resolve(results);
        })
        .on('error', (error) => {
          console.error('Error parsing CSV:', error);
          reject(error);
        });
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

// Function to update inventory in database
async function updateInventory(items) {
  console.log('Starting inventory update...');
  try {
    if (items.length > 0) {
      console.log('Sample item structure:', items[0]);
    }

    const updates = items.map(item => 
      prisma.iTCInventory.upsert({
        where: { sku: item.sku || item.SKU || item['Part Number'] || '' },
        update: {
          description: item.description || item.Description || item['Product Description'] || '',
          price: parseFloat(item.price || item.Price || item['Unit Price'] || '0'),
          quantity: parseInt(item.quantity || item.Quantity || item['Available Quantity'] || '0'),
          lastUpdated: new Date()
        },
        create: {
          sku: item.sku || item.SKU || item['Part Number'] || '',
          description: item.description || item.Description || item['Product Description'] || '',
          price: parseFloat(item.price || item.Price || item['Unit Price'] || '0'),
          quantity: parseInt(item.quantity || item.Quantity || item['Available Quantity'] || '0'),
          lastUpdated: new Date()
        }
      })
    );

    console.log(`Attempting to update ${updates.length} items`);
    await prisma.$transaction(updates);
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
    console.log('FTP Configuration:', {
      host: config.host,
      user: config.user,
      filePath: config.filePath
    });

    console.log('FTP module:', ftp);
    console.log('FTP Client:', ftp.Client);

    const client = new ftp.Client();
    client.ftp.verbose = true; // Enable verbose logging
    
    try {
      // Connect to FTP server
      console.log('Connecting to FTP server...');
      await client.access({
        host: config.host,
        user: config.user,
        password: config.password,
        secure: false
      });
      
      // List directory contents
      console.log('Listing directory contents:');
      const list = await client.list();
      console.log('Files in directory:', list.map(item => item.name));
      
      // Download and parse inventory file
      console.log('Downloading inventory file...');
      const items = await downloadAndParseCSV(client, config.filePath);
      
      // Update inventory in database
      const updatedCount = await updateInventory(items);
      
      console.log('CRON_SECRET:', process.env.CRON_SECRET);
      
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
        details: error.response?.data || 'Check server logs for more information'
      },
      { status: error.response?.status || 500 }
    );
  }
} 