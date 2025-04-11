import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        // Step 1: Get token from Clover API
        const tokenUrl = 'https://www.cloverimaging.com/access-point/token';
        const tokenData = {
            apiKey: "j9yHorfoA3HpWOxDMBMw4AF26b396oAUkApYIbUgtu3pw6o4OZmortBSdUE3tVP1boyTpOCPkYE7XCdEqoKCieQ6Ptos5wfmsjqTNFcewIsiTL27kyJtclT15VsLIDM4fvfiNOjP6WI979W7MVpWM33W5LQNpegSxqUiBHu54A7LCfQLFjsZpL5I6ynEkA1hVZsQRwY9pLVo06AcVZ5agCe6CA8MGiYh4HMDHtyWMbI43LDgb4Ti08Nial"
        };
        const tokenHeaders = {
            'Content-Type': 'application/json'
        };
        
        const tokenResponse = await axios.post(tokenUrl, tokenData, { headers: tokenHeaders });
        
        if (!tokenResponse.data || !tokenResponse.data.accessToken) {
            return NextResponse.json({ 
                success: false, 
                message: "Failed to get access token from Clover API" 
            }, { status: 500 });
        }
        
        const accessToken = tokenResponse.data.accessToken;
        
        // Step 2: Get products from Clover API
        const productsUrl = 'https://www.cloverimaging.com/access-point/products';
        const productsData = {
            apiKey: "j9yHorfoA3HpWOxDMBMw4AF26b396oAUkApYIbUgtu3pw6o4OZmortBSdUE3tVP1boyTpOCPkYE7XCdEqoKCieQ6Ptos5wfmsjqTNFcewIsiTL27kyJtclT15VsLIDM4fvfiNOjP6WI979W7MVpWM33W5LQNpegSxqUiBHu54A7LCfQLFjsZpL5I6ynEkA1hVZsQRwY9pLVo06AcVZ5agCe6CA8MGiYh4HMDHtyWMbI43LDgb4Ti08Nial",
            page: 1,
            // Empty search to get all products
            filters: {
                search: "",
                productTypes: ["1"]
            }
        };
        const productsHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        };
        
        const productsResponse = await axios.post(productsUrl, productsData, { headers: productsHeaders });
        
        if (!productsResponse.data || !productsResponse.data.products) {
            return NextResponse.json({ 
                success: false, 
                message: "Failed to get products from Clover API" 
            }, { status: 500 });
        }
        
        const totalItems = productsResponse.data.products.length;
        const totalPages = productsResponse.data.totalPages || 1;
        
        return NextResponse.json({
            success: true,
            count: {
                items: totalItems,
                currentPage: 1,
                totalPages: totalPages,
                estimatedTotalItems: totalItems * totalPages
            },
            apiDetails: {
                provider: "Clover Imaging API",
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Error counting Clover products:', error);
        return NextResponse.json({ 
            success: false, 
            message: "Error counting Clover products",
            error: error.message
        }, { status: 500 });
    }
} 