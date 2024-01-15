import axios from 'axios';
import { NextResponse } from 'next/server'

export async function POST(req, res) {    
    const newData = await req.json()    
    console.log(newData.token, "this is the body")
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newData.token}`
    };
    const url = 'https://www.cloverimaging.com/access-point/products';
    const data = {
        apiKey: "yiidRf8FHTYTJlBtJY4oTsKhELkOJ3LRdvequPhYY5Mhpt4vApBM03LPXxpqPkfO8Z03UXWJhAhH3EqSYYzUhV5iS38B3YezSDHEmJmdgkyMc3YmjEmIacWuYRd4kZ0KqVChrABdCOm1YwyHP6smBgP1DbhzphRYWftX4tJnbB2nPXmPvuZuBoSDKGQbYGlC89JHQsbnciQLAednwQztuK0CqmvWfZR8H5eHqZw1O9ApOmE1KGybUqGLeH",
        page: 1,
        filters: {
            search: `${newData.search}`,
            productTypes: [
                "1"
            ]
        }
    }
    try {        
        const response = await axios.post(url, data, { headers })       
        return NextResponse.json({ "cancel": response.data })          
    } catch (error) {
        console.error('Error sending email:', error);
    }
    // res.status(200).json(result)
}
