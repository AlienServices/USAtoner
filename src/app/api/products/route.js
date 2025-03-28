import axios from 'axios';
import { NextResponse } from 'next/server'

// Function to fetch categories from Clover Imaging API
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 400 });
        }

        // Set up headers for the API request
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // If requesting categories
        if (type === 'categories') {
            try {
                // Make sure to use proper search terms for Konica Minolta
                const response = await axios.post('https://www.cloverimaging.com/access-point/products', {
                    apiKey: process.env.CLOVER_API_KEY,
                    filters: {
                        search: "konica bizhub",  // Be more specific to get better results
                        productTypes: ["1"]       // Product type for toners
                    }
                }, { headers });

                // Return the categories data
                return NextResponse.json(response.data);
            } catch (error) {
                console.error('Error fetching categories:', error.response?.data || error.message);
                
                // Create fallback categories for Konica Minolta
                const fallbackCategories = {
                    page: 1,
                    totalPages: 1,
                    products: [
                        // Include some representative Konica Minolta products
                        {
                            id: 'fallback1',
                            title: 'Konica Minolta Bizhub C224 Black Toner',
                            oemNos: [{ oemNo: 'TN-321K' }]
                        },
                        {
                            id: 'fallback2',
                            title: 'Konica Minolta Bizhub C364 Cyan Toner',
                            oemNos: [{ oemNo: 'TN-321C' }]
                        },
                        {
                            id: 'fallback3',
                            title: 'Konica Minolta Bizhub 224e Black Toner',
                            oemNos: [{ oemNo: 'TN-323' }]
                        },
                        {
                            id: 'fallback4',
                            title: 'Konica Minolta Bizhub 368 Black Toner',
                            oemNos: [{ oemNo: 'TN-326' }]
                        }
                    ]
                };
                
                // Return fallback data instead of error
                return NextResponse.json(fallbackCategories);
            }
        }

        // For other requests, return an error
        return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });

    } catch (error) {
        console.error('API route error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error.message 
        }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { token, search, category } = body;

        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 400 });
        }

        // Set up headers for the API request
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // Prepare the request body
        const requestBody = {
            apiKey: process.env.CLOVER_API_KEY,
            filters: {
                search: search || "",
                productTypes: ["1"]
            }
        };

        // Add category filter if provided
        if (category) {
            requestBody.filters.categories = [category];
        }

        try {
            const response = await axios.post(
                'https://www.cloverimaging.com/access-point/products',
                requestBody,
                { headers }
            );

            // Return the products data
            return NextResponse.json(response.data);
        } catch (error) {
            console.error('Error fetching products:', error.response?.data || error.message);
            return NextResponse.json({ 
                error: 'Failed to fetch products',
                details: error.response?.data || error.message 
            }, { status: 500 });
        }

    } catch (error) {
        console.error('API route error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error.message 
        }, { status: 500 });
    }
}
