import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET(req) {
    const results = {
        tests: [],
        overallSuccess: false,
        message: ""
    };

    try {
        // Step 1: Test token endpoint
        results.tests.push({ name: "Token Endpoint Test", status: "running" });
        
        try {
            const tokenUrl = 'https://www.cloverimaging.com/access-point/token';
            const tokenData = {
                apiKey: "j9yHorfoA3HpWOxDMBMw4AF26b396oAUkApYIbUgtu3pw6o4OZmortBSdUE3tVP1boyTpOCPkYE7XCdEqoKCieQ6Ptos5wfmsjqTNFcewIsiTL27kyJtclT15VsLIDM4fvfiNOjP6WI979W7MVpWM33W5LQNpegSxqUiBHu54A7LCfQLFjsZpL5I6ynEkA1hVZsQRwY9pLVo06AcVZ5agCe6CA8MGiYh4HMDHtyWMbI43LDgb4Ti08Nial"
            };
            const tokenHeaders = {
                'Content-Type': 'application/json'
            };
            
            const tokenResponse = await axios.post(tokenUrl, tokenData, { headers: tokenHeaders });
            
            if (!tokenResponse.data || !tokenResponse.data.accessToken) {
                throw new Error("Token response did not contain accessToken");
            }
            
            const tokenInfo = {
                hasToken: true,
                tokenType: tokenResponse.data.tokenType,
                tokenLength: tokenResponse.data.accessToken.length,
                tokenPrefix: tokenResponse.data.accessToken.substring(0, 10) + '...',
                expiresIn: tokenResponse.data.expiresIn
            };
            
            results.tests[0].status = "success";
            results.tests[0].details = tokenInfo;
            
            // Step 2: Test products endpoint with the token
            results.tests.push({ name: "Products Endpoint Test", status: "running" });
            
            // Try different auth formats
            const authFormats = [
                { name: "token-only", value: tokenResponse.data.accessToken },
                { name: "bearer-prefix", value: `Bearer ${tokenResponse.data.accessToken}` }
            ];
            
            let productsSuccess = false;
            
            for (const authFormat of authFormats) {
                try {
                    const productsUrl = 'https://www.cloverimaging.com/access-point/products';
                    const productsData = {
                        apiKey: "j9yHorfoA3HpWOxDMBMw4AF26b396oAUkApYIbUgtu3pw6o4OZmortBSdUE3tVP1boyTpOCPkYE7XCdEqoKCieQ6Ptos5wfmsjqTNFcewIsiTL27kyJtclT15VsLIDM4fvfiNOjP6WI979W7MVpWM33W5LQNpegSxqUiBHu54A7LCfQLFjsZpL5I6ynEkA1hVZsQRwY9pLVo06AcVZ5agCe6CA8MGiYh4HMDHtyWMbI43LDgb4Ti08Nial",
                        page: 1,
                        filters: {
                            search: "",
                            productTypes: ["1"]
                        }
                    };
                    const productsHeaders = {
                        'Content-Type': 'application/json',
                        'Authorization': authFormat.value
                    };
                    
                    const productsResponse = await axios.post(productsUrl, productsData, { headers: productsHeaders });
                    
                    if (productsResponse.data && productsResponse.data.products) {
                        results.tests[1].status = "success";
                        results.tests[1].details = {
                            authFormat: authFormat.name,
                            productCount: productsResponse.data.products.length,
                            sample: productsResponse.data.products.slice(0, 2).map(p => ({ 
                                title: p.title,
                                oem: p.oemNos && p.oemNos[0] ? p.oemNos[0].oemNo : 'unknown'
                            }))
                        };
                        productsSuccess = true;
                        break;
                    } else {
                        throw new Error("Products response did not contain products array");
                    }
                } catch (err) {
                    // Continue to the next auth format
                    console.log(`Auth format ${authFormat.name} failed:`, err.message);
                }
            }
            
            if (!productsSuccess) {
                results.tests[1].status = "failed";
                results.tests[1].error = "All authentication formats failed";
                throw new Error("Could not authenticate with products endpoint");
            }
            
            results.overallSuccess = true;
            results.message = "All tests passed! Clover API credentials are working.";
            
        } catch (error) {
            // Mark the current test as failed
            const currentTest = results.tests.find(t => t.status === "running");
            if (currentTest) {
                currentTest.status = "failed";
                currentTest.error = error.message;
                
                if (error.response) {
                    currentTest.errorDetails = {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data
                    };
                }
            }
            
            results.overallSuccess = false;
            results.message = `Test failed: ${error.message}`;
        }
        
    } catch (err) {
        results.overallSuccess = false;
        results.message = `Error running tests: ${err.message}`;
    }
    
    return NextResponse.json(results);
} 