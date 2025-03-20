import axios from 'axios';
import { NextResponse } from 'next/server'

export async function POST(req, res) {    
    const newData = await req.json()    
    console.log(newData.token, "this is the body")
    console.log(newData, "this is the body")
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newData.token}`
    };
    const url = 'https://www.cloverimaging.com/access-point/products';
    const data = {
        apiKey: "j9yHorfoA3HpWOxDMBMw4AF26b396oAUkApYIbUgtu3pw6o4OZmortBSdUE3tVP1boyTpOCPkYE7XCdEqoKCieQ6Ptos5wfmsjqTNFcewIsiTL27kyJtclT15VsLIDM4fvfiNOjP6WI979W7MVpWM33W5LQNpegSxqUiBHu54A7LCfQLFjsZpL5I6ynEkA1hVZsQRwY9pLVo06AcVZ5agCe6CA8MGiYh4HMDHtyWMbI43LDgb4Ti08Nial",
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
        console.log(response, "this is the tesponse")    
        return NextResponse.json({ "cancel": response.data })          
    } catch (error) {
        console.error('Error sending email:', error);
    }
    // res.status(200).json(result)
}
