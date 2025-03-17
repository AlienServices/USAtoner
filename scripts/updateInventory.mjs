import fetch from 'node-fetch';

// Hardcoded CRON_SECRET for testing
const SECRET = "USAtonerSecretKey12345678";

async function runUpdate() {
  console.log("Starting inventory update with hardcoded secret");
  
  try {
    const response = await fetch('http://127.0.0.1:3000/api/update-inventory', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SECRET}`
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