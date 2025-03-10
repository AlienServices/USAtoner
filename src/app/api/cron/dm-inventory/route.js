import { NextResponse } from 'next/server';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import dmPrisma from '@/lib/dm-prisma';

// Helper function to get DM API configuration
const getDMConfig = () => ({
  apiKey: process.env.DM_API_KEY,
  isa: process.env.DM_ISA,
  orgId: process.env.DM_ORG_ID,
  contactId: process.env.DM_CONTACT_ID
});

// Function to build SOAP request body for catalog request
const buildCatalogRequestBody = (config) => {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <RequestAllInfo xmlns="http://portal.suppliesnet.net">
      <InputRequestNode>
        <dmi:ItemInformation GetPrice="1" GetAvailability="1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dmi="http://portal.suppliesnet.net">
          <dmi:ContactID>${config.contactId}</dmi:ContactID>
          <dmi:APIKey>${config.apiKey}</dmi:APIKey>
        </dmi:ItemInformation>
      </InputRequestNode>
    </RequestAllInfo>
  </soap:Body>
</soap:Envelope>`;
};

// Function to parse XML response and extract inventory data
const parseInventoryResponse = async (xmlResponse) => {
  try {
    const result = await parseStringPromise(xmlResponse);
    
    // Extract the Items array from the response
    const items = result?.['soap:Envelope']?.['soap:Body']?.[0]?.RequestAllInfoResponse?.[0]?.Items?.[0]?.Item || [];
    
    return items.map(item => ({
      referenceNumber: item.$.ReferenceNumber,
      oemNumber: item.$.OEMNumber,
      sellUOM: item.$.SellUOM,
      price: parseFloat(item.Price?.[0]?._) || 0,
      availability: item.Availability?.map(a => ({
        dc: a.$.DC,
        quantity: parseInt(a._, 10) || 0
      })) || []
    }));
  } catch (error) {
    console.error('Error parsing XML response:', error);
    throw error;
  }
};

// Function to update inventory in database
const updateInventory = async (items) => {
  const updates = items.map(item => 
    dmPrisma.dMInventory.upsert({
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

  await dmPrisma.$transaction(updates);
};

export async function GET(req) {
  // Verify the request is from the cron job
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = getDMConfig();
  
  try {
    const headers = {
      'Content-Type': 'text/xml',
      'SOAPAction': '"http://portal.suppliesnet.net/RequestAllInfo"'
    };

    const response = await axios.post(
      'https://portal.suppliesnet.net/CatalogRequest/CatalogRequest.asmx',
      buildCatalogRequestBody(config),
      { headers }
    );

    const items = await parseInventoryResponse(response.data);
    await updateInventory(items);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        itemCount: items.length,
        message: 'Inventory updated successfully',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error in DM inventory cron job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: error.response?.status || 500 }
    );
  }
} 