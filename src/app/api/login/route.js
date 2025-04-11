import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(req, res) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    try {
        // For this simple implementation, we'll ignore the username/password
        // and just fetch a token from the API directly
        const url = 'https://www.cloverimaging.com/access-point/token';
        const data = {
            apiKey: "j9yHorfoA3HpWOxDMBMw4AF26b396oAUkApYIbUgtu3pw6o4OZmortBSdUE3tVP1boyTpOCPkYE7XCdEqoKCieQ6Ptos5wfmsjqTNFcewIsiTL27kyJtclT15VsLIDM4fvfiNOjP6WI979W7MVpWM33W5LQNpegSxqUiBHu54A7LCfQLFjsZpL5I6ynEkA1hVZsQRwY9pLVo06AcVZ5agCe6CA8MGiYh4HMDHtyWMbI43LDgb4Ti08Nial"
        };
        
        console.log("Requesting new token from Clover Imaging API...");
        const response = await axios.post(url, data, { headers });
        
        if (response.data && response.data.accessToken) {
            console.log("Token obtained successfully");
            // Return the token directly in the format expected by the application
            return NextResponse.json({
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken || null,
                expiresIn: response.data.expiresIn || 3600,
                tokenType: response.data.tokenType || "Bearer"
            });
        } else if (response.data && response.data.token && response.data.token.accessToken) {
            // Handle nested token structure
            console.log("Token obtained successfully (nested format)");
            return NextResponse.json({
                accessToken: response.data.token.accessToken,
                refreshToken: response.data.token.refreshToken || null,
                expiresIn: response.data.token.expiresIn || 3600,
                tokenType: response.data.token.tokenType || "Bearer"
            });
        } else {
            console.error("Invalid token response format:", JSON.stringify(response.data).substring(0, 200));
            return NextResponse.json(
                { error: "Failed to obtain valid token", details: response.data },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error during login:', error.message);
        // Return appropriate error response
        return NextResponse.json(
            { 
                error: "Authentication failed", 
                details: { 
                    message: error.message,
                    response: error.response?.data || null
                } 
            },
            { status: 500 }
        );
    }
} 