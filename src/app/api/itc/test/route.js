import { NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';
import csv from 'csv-parser';
import { Readable, Writable } from 'stream';

const getITCConfig = () => {
  return {
    host: process.env.ITC_FTP_HOST,
    user: process.env.ITC_FTP_USER,
    password: process.env.ITC_FTP_PASSWORD,
    filePath: process.env.ITC_FTP_FILE_PATH
  };
};

export async function GET() {
  try {
    console.log('Starting ITC FTP test...');
    const config = getITCConfig();
    
    // Create FTP client
    const client = new ftp.Client();
    client.ftp.verbose = true;
    
    try {
      console.log('Connecting to FTP server...');
      await client.access({
        host: config.host,
        user: config.user,
        password: config.password,
        secure: false
      });
      
      console.log('Connected successfully');
      console.log('Attempting to download file:', config.filePath);
      
      // Create a writable stream to collect chunks
      const chunks = [];
      const writableStream = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk);
          callback();
        }
      });

      // Download the file
      await client.downloadTo(writableStream, config.filePath);
      
      // Convert chunks to string
      const fileContent = Buffer.concat(chunks).toString();
      console.log('File downloaded, first 200 characters:', fileContent.substring(0, 200));
      
      // Process the CSV data
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
            skipLines: 1 // Skip the header row since we're defining headers manually
          }))
          .on('data', (data) => {
            // Skip the header row if it matches our column names
            if (data.PartNo !== 'PartNo') {
              items.push(data);
            }
          })
          .on('end', () => {
            console.log('CSV parsing completed');
            resolve();
          })
          .on('error', (error) => {
            console.error('Error parsing CSV:', error);
            reject(error);
          });
      });
      
      // Log sample data
      const sampleItems = items.slice(0, 2);
      console.log('Sample items:', JSON.stringify(sampleItems, null, 2));
      
      return NextResponse.json({
        success: true,
        data: {
          totalItems: items.length,
          sampleItems
        }
      });
      
    } catch (ftpError) {
      console.error('FTP Error:', ftpError);
      return NextResponse.json({
        success: false,
        error: 'FTP Error',
        details: ftpError.message
      }, { status: 500 });
    } finally {
      client.close();
    }
    
  } catch (error) {
    console.error('General Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: 'No additional details available'
    }, { status: 500 });
  }
} 