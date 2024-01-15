import axios from 'axios';
import { NextResponse } from 'next/server'

export async function POST(req, res) {
    // console.log("kale")
    const headers = {
        'Content-Type': 'application/json'
    };
    try {        
        const url = 'https://www.cloverimaging.com/access-point/token';
        const data = {
            apiKey: "yiidRf8FHTYTJlBtJY4oTsKhELkOJ3LRdvequPhYY5Mhpt4vApBM03LPXxpqPkfO8Z03UXWJhAhH3EqSYYzUhV5iS38B3YezSDHEmJmdgkyMc3YmjEmIacWuYRd4kZ0KqVChrABdCOm1YwyHP6smBgP1DbhzphRYWftX4tJnbB2nPXmPvuZuBoSDKGQbYGlC89JHQsbnciQLAednwQztuK0CqmvWfZR8H5eHqZw1O9ApOmE1KGybUqGLeH"
        }
        const response = await axios.post(url, data, { headers })
        // console.log(response, "access token")
        return NextResponse.json({ "cancel": response.data })    
    } catch (error) {
        console.error('Error sending email:', error);
    }
    
}
    