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
        
        // Enhance products with origin information
        // In a real implementation, this would come from your database or API
        // For demo purposes, we're assigning origins randomly
        if (response.data && response.data.products) {
            const origins = ['USA', 'Canada', 'Mexico', 'China', 'Japan', 'Germany', 'UK'];
            const enhancedProducts = response.data.products.map(product => {
                // Determine origin based on product properties (this is a simplified example)
                // In a real implementation, you'd have this data stored or provided by the API
                let origin;
                
                // Example logic - you would replace this with real product origin data
                // For demo, we're using the product ID to assign a consistent origin to each product
                const idSum = product.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                
                // Assign origin based on ID sum
                if (idSum % 5 === 0) {
                    origin = 'USA';
                } else if (idSum % 5 === 1) {
                    origin = 'Canada';
                } else if (idSum % 5 === 2) {
                    origin = 'Mexico';
                } else if (idSum % 5 === 3) {
                    origin = 'China';
                } else {
                    origin = origins[Math.floor(Math.random() * origins.length)];
                }
                
                return {
                    ...product,
                    origin
                };
            });
            
            response.data.products = enhancedProducts;
        }
        
        return NextResponse.json({ "cancel": response.data })          
    } catch (error) {
        console.error('Error sending email:', error);
    }
    // res.status(200).json(result)
}
