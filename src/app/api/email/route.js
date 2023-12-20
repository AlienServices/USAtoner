import axios from 'axios';
import { NextResponse } from 'next/server'

export async function POST(req, res) {    
    
    const newData = await req.json().catch((err) => {
        console.log(err, "this is log error")
    })    
    const headers = {
        'Content-Type': 'application/json'
    };
    const url = 'https://apisandbox.cloverimaging.com/access-point/token';
    const data = {
        apiKey: "InxNPYlpXTDX4xTxiyBBvqcrcD8CvAWMQ8lnhkWx9Wz17bka4HowdTXsY1lzLqQYuDxPpH6FRPmJ5WQeJk6I7ZurwowMQzMoxHAH8Fh8EeAcpnq5pvaqgsCKpxWaJQtRuhnLtf7apZuywH0On7sbjODBeYab8o5rbZgRtza8Nb0A6u8LCTQem6efaPF9Uhy0zOZCELxU10yPa0E8HclZXtKNEYKCZWH2IEp8z0ZhJ8K4LmqqY6AcFcxvMj"
    }
    try {
        const response = await axios.post(url, data, { headers })
        return NextResponse.json({ "cancel": response.data })
    } catch (error) {
        console.error('Error sending email:', error);
    }
    // res.status(200).json(result)

}
