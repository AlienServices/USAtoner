import axios from 'axios';
import { NextResponse } from 'next/server'

export async function Token(req, res) {
    // console.log("kale")
    const headers = {
        'Content-Type': 'application/json'
    };
    try {        
        const url = 'https://apisandbox.cloverimaging.com/access-point/token';
        const data = {
            apiKey: "InxNPYlpXTDX4xTxiyBBvqcrcD8CvAWMQ8lnhkWx9Wz17bka4HowdTXsY1lzLqQYuDxPpH6FRPmJ5WQeJk6I7ZurwowMQzMoxHAH8Fh8EeAcpnq5pvaqgsCKpxWaJQtRuhnLtf7apZuywH0On7sbjODBeYab8o5rbZgRtza8Nb0A6u8LCTQem6efaPF9Uhy0zOZCELxU10yPa0E8HclZXtKNEYKCZWH2IEp8z0ZhJ8K4LmqqY6AcFcxvMj"
        }
        const response = await axios.post(url, data, { headers })
        // console.log(response, "access token")
        return response
        // return NextResponse.json({ "cancel": response.data })
    } catch (error) {
        console.error('Error sending email:', error);
    }
    
}
    