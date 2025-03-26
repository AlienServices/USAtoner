import axios from 'axios';
import { NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';

// Remove https import since it's causing issues in the Next.js serverless environment
// import https from 'https';

export async function GET(req) {
    try {
        console.log("DM Supplies API endpoint called");
        
        // Use a simpler approach for now - return mock data to verify client works
        return NextResponse.json({
            success: true,
            count: {
                totalItems: 2157
            },
            apiDetails: {
                provider: "DM Supplies API (Mock Data)",
                timestamp: new Date().toISOString(),
                agreementScheduleID: "QT23-090684",
                note: "Using mock data because API connectivity is being resolved"
            }
        });
        
    } catch (error) {
        console.error('Server-side error in DM Supplies API:', error);
        
        // Return a more detailed error response
        return NextResponse.json({
            success: false,
            error: {
                message: error.message || "Unknown server error",
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        }, { status: 500 });
    }
} 