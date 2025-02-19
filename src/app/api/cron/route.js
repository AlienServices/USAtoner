export async function GET() {
  try {
    // Trigger FTP update
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/ftp`, {
      method: 'GET'
    })
    
    const data = await response.json()
    return new Response(JSON.stringify(data))
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Failed to trigger FTP update" 
    }), { status: 500 })
  }
} 