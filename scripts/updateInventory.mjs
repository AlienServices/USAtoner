import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Load CRON_SECRET from environment variables
const CRON_SECRET = process.env.CRON_SECRET?.trim();

if (!CRON_SECRET) {
  console.error("Error: CRON_SECRET is not set in environment variables.");
  process.exit(1);
}

async function runUpdate() {
  console.log("Starting inventory update with CRON_SECRET from environment");
  
  try {
    const response = await fetch('http://127.0.0.1:3000/api/update-inventory', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });
    
    console.log('Response Status:', response.status);
    
    const textResponse = await response.text();
    console.log('Raw Response:', textResponse);
    
    if (!response.ok) {
      console.error('Error response:', textResponse);
      return;
    }
    
    console.log('Success!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

runUpdate();