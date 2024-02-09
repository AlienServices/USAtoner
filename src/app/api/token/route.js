import axios from 'axios';
import { NextResponse } from 'next/server'

export async function POST(req, res) {    
    const headers = {
        'Content-Type': 'application/json'
    };
    try {        
        const url = 'https://www.cloverimaging.com/access-point/token';
        const data = {
            apiKey: "j9yHorfoA3HpWOxDMBMw4AF26b396oAUkApYIbUgtu3pw6o4OZmortBSdUE3tVP1boyTpOCPkYE7XCdEqoKCieQ6Ptos5wfmsjqTNFcewIsiTL27kyJtclT15VsLIDM4fvfiNOjP6WI979W7MVpWM33W5LQNpegSxqUiBHu54A7LCfQLFjsZpL5I6ynEkA1hVZsQRwY9pLVo06AcVZ5agCe6CA8MGiYh4HMDHtyWMbI43LDgb4Ti08Nial"
        }
        const response = await axios.post(url, data, { headers })   
        console.log(response.data, "this is the token data")             
        return NextResponse.json({ "token": response.data })    
    } catch (error) {
        console.error('Error sending email:', error);
    }
    
}
    