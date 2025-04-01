import axios from 'axios';
import { NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

// Helper function to get DM API configuration
const getDMConfig = () => ({
  apiKey: process.env.DM_API_KEY || '0751E703-3D4D-4B37-9156-088F43AECBDB',
  isa: process.env.DM_ISA || '4012025D2D',
  orgId: process.env.DM_ORG_ID || '4012025',
  contactId: process.env.DM_CONTACT_ID || '6043937',
  agreementScheduleId: process.env.DM_AGREEMENT_SCHEDULE_ID || 'QT23-090684'
});

// Function to build SOAP request body for RequestAllInfo
const buildRequestAllInfoBody = (config) => {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <RequestAllInfo xmlns="http://portal.suppliesnet.net">
      <InputRequestNode>
        <dmi:ItemInformation GetPrice="1" GetAvailability="1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dmi="http://portal.suppliesnet.net">
          <dmi:ContactID>${config.contactId}</dmi:ContactID>
          <dmi:APIKey>${config.apiKey}</dmi:APIKey>
          <dmi:AgreementSchedule>${config.agreementScheduleId}</dmi:AgreementSchedule>
          <dmi:ZipCode></dmi:ZipCode>
        </dmi:ItemInformation>
      </InputRequestNode>
    </RequestAllInfo>
  </soap:Body>
</soap:Envelope>`;
};

// Function to check for errors in DM API response
const checkForErrors = (result) => {
  const errors = result?.['soap:Envelope']?.['soap:Body']?.[0]?.['soap:Fault'] || 
                result?.['soap:Envelope']?.['soap:Body']?.[0]?.RequestAllInfoResponse?.[0]?.RequestAllInfoResult?.[0]?.['dmi:ItemInformation']?.[0]?.['dmi:Errors']?.[0]?.['dmi:Error'];
  
  if (errors) {
    const errorNumber = errors[0]?.ErrorNumber?.[0] || errors[0]?.['dmi:ErrorNumber']?.[0] || 'Unknown';
    const errorDesc = errors[0]?.ErrorDescription?.[0] || errors[0]?.['dmi:ErrorDescription']?.[0] || 'Unknown Error';
    throw new Error(`DM API Error ${errorNumber}: ${errorDesc}`);
  }
};

// Function to get and process all items from the catalog with details
const getAllItems = async (config) => {
  const headers = {
    'Content-Type': 'text/xml; charset=utf-8',
    'SOAPAction': '"http://portal.suppliesnet.net/RequestAllInfo"'
  };

  console.log('Fetching all catalog items with details from DM API');
  const response = await axios.post(
    'https://portal.suppliesnet.net/CatalogRequest/CatalogRequest.asmx',
    buildRequestAllInfoBody(config),
    { headers, timeout: 120000 } // Increased timeout for the larger request
  );

  console.log('Raw RequestAllInfo response received:', response.data.substring(0, 500) + '...');
  const result = await parseStringPromise(response.data);
  
  // Check for errors
  checkForErrors(result);
  
  // Extract items from the response
  const items = result?.['soap:Envelope']?.['soap:Body']?.[0]?.RequestAllInfoResponse?.[0]?.RequestAllInfoResult?.[0]?.['dmi:ItemInformation']?.[0]?.['dmi:Items']?.[0]?.['dmi:Item'] || [];
  
  console.log(`Found ${items.length} items in the catalog with details`);
  
  // Transform items to a more usable format
  const processedItems = items.map(item => {
    const price = parseFloat(item['dmi:Price']?.[0]) || 0;
    const availability = parseInt(item['dmi:Availability']?.[0]) || 0;
    
    if (price === -1 || availability === -1) {
      console.log(`Skipping invalid item: ${item.$.ReferenceNumber}`);
      return null;
    }

    return {
      referenceNumber: item.$.ReferenceNumber,
      oemNumber: item.$.OEMNumber || null,
      sellUOM: item.$.SellUOM,
      price: price,
      availability: [{
        dc: 'default',
        quantity: availability
      }]
    };
  }).filter(Boolean);

  return processedItems;
};

// Function to update inventory in database
const updateInventory = async (items) => {
  if (items.length === 0) {
    console.log('No valid items to update');
    return;
  }

  console.log('Starting inventory update...');
  try {
    // Process items in batches to avoid transaction size limits
    const batchSize = 100;
    let updatedCount = 0;
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      console.log(`Processing batch ${i / batchSize + 1} with ${batch.length} items`);
      
      const updates = batch.map(item => 
        prisma.dMInventory.upsert({
          where: { referenceNumber: item.referenceNumber },
          update: {
            oemNumber: item.oemNumber,
            sellUOM: item.sellUOM,
            price: item.price,
            availability: item.availability,
            lastUpdated: new Date()
          },
          create: {
            referenceNumber: item.referenceNumber,
            oemNumber: item.oemNumber,
            sellUOM: item.sellUOM,
            price: item.price,
            availability: item.availability,
            lastUpdated: new Date()
          }
        })
      );

      await prisma.$transaction(updates);
      updatedCount += batch.length;
      console.log(`Processed ${updatedCount} items so far`);
    }
    
    console.log(`Successfully updated ${updatedCount} items`);
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
};

export async function GET(req) {
  console.log('Starting DM inventory update process using RequestAllInfo...');
  const config = getDMConfig();
  
  try {
    // Get all items with their details in one request
    const items = await getAllItems(config);
    
    if (items.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: {
          itemCount: 0,
          message: 'No valid items found in catalog',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Update inventory with the retrieved items
    await updateInventory(items);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        itemCount: items.length,
        message: 'Inventory updated successfully using RequestAllInfo',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching DM inventory with RequestAllInfo:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: error.response?.data || 'No additional details available'
      },
      { status: error.response?.status || 500 }
    );
  }
} 