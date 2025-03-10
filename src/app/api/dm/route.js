import axios from 'axios';
import { NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';
import { PrismaClient } from '@prisma/dm-client';

// Initialize Prisma client
const dmPrisma = new PrismaClient();

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
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <GetCatalog xmlns="http://portal.suppliesnet.net/">
      <contactID>${config.contactId}</contactID>
      <apiKey>${config.apiKey}</apiKey>
      <isa>${config.isa}</isa>
      <orgID>${config.orgId}</orgID>
    </GetCatalog>
  </soap:Body>
</soap:Envelope>`;
};

// Function to build SOAP request body for item details
const buildItemDetailsRequestBody = (config, referenceNumbers) => {
  const itemNodes = referenceNumbers.map(ref => `<dmi:Item ReferenceNumber="${ref}"></dmi:Item>`).join('\n');
  
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <RequestInfo xmlns="http://portal.suppliesnet.net">
      <InputRequestNode>
        <dmi:ItemInformation GetPrice="1" GetAvailability="1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dmi="http://portal.suppliesnet.net">
          <dmi:ContactID>${config.contactId}</dmi:ContactID>
          <dmi:APIKey>${config.apiKey}</dmi:APIKey>
          <dmi:Items>
            ${itemNodes}
          </dmi:Items>
        </dmi:ItemInformation>
      </InputRequestNode>
    </RequestInfo>
  </soap:Body>
</soap:Envelope>`;
};

// Function to check for errors in DM API response
const checkForErrors = (result) => {
  const errors = result?.['soap:Envelope']?.['soap:Body']?.[0]?.['soap:Fault'] || 
                result?.['soap:Envelope']?.['soap:Body']?.[0]?.GetCatalogResponse?.[0]?.GetCatalogResult?.[0]?.Errors?.[0]?.Error || 
                result?.['soap:Envelope']?.['soap:Body']?.[0]?.RequestInfoResponse?.[0]?.RequestInfoResult?.[0]?.['dmi:ItemInformation']?.[0]?.['dmi:Errors']?.[0]?.['dmi:Error'];
  
  if (errors) {
    const errorNumber = errors[0]?.ErrorNumber?.[0] || errors[0]?.['dmi:ErrorNumber']?.[0] || 'Unknown';
    const errorDesc = errors[0]?.ErrorDescription?.[0] || errors[0]?.['dmi:ErrorDescription']?.[0] || 'Unknown Error';
    throw new Error(`DM API Error ${errorNumber}: ${errorDesc}`);
  }
};

// Function to get reference numbers from catalog
const getCatalogItems = async (config) => {
  const headers = {
    'Content-Type': 'text/xml; charset=utf-8',
    'SOAPAction': '"http://portal.suppliesnet.net/GetCatalog"'
  };

  console.log('Fetching catalog from DM API with headers:', headers);
  const response = await axios.post(
    'https://portal.suppliesnet.net/CatalogRequest/CatalogRequest.asmx',
    buildCatalogRequestBody(config),
    { headers, timeout: 30000 }  // Reduced timeout for catalog request
  );

  console.log('Raw catalog response:', response.data);
  const result = await parseStringPromise(response.data);
  
  // Check for errors
  checkForErrors(result);
  
  // Updated path to match GetCatalog response structure
  const catalog = result?.['soap:Envelope']?.['soap:Body']?.[0]?.GetCatalogResponse?.[0]?.GetCatalogResult?.[0]?.Items?.[0]?.Item || [];
  
  console.log(`Found ${catalog.length} items in catalog`);
  return catalog.map(item => item.ReferenceNumber[0]);
};

// Function to get item details in batches
const getItemDetails = async (config, referenceNumbers) => {
  const batchSize = 25; // Reduced batch size
  const allItems = [];
  
  for (let i = 0; i < referenceNumbers.length; i += batchSize) {
    const batch = referenceNumbers.slice(i, i + batchSize);
    console.log(`Fetching details for items ${i + 1} to ${i + batch.length}...`);
    
    try {
      const headers = {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '"http://portal.suppliesnet.net/RequestInfo"'
      };

      const response = await axios.post(
        'https://portal.suppliesnet.net/CatalogRequest/CatalogRequest.asmx',
        buildItemDetailsRequestBody(config, batch),
        { headers, timeout: 30000 }
      );

      const result = await parseStringPromise(response.data);
      
      // Check for errors
      checkForErrors(result);
      
      const items = result?.['soap:Envelope']?.['soap:Body']?.[0]?.RequestInfoResponse?.[0]?.RequestInfoResult?.[0]?.['dmi:ItemInformation']?.[0]?.['dmi:Items']?.[0]?.['dmi:Item'] || [];
      
      const validItems = items.map(item => {
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

      allItems.push(...validItems);
      console.log(`Added ${validItems.length} valid items from batch`);
      
      // Increased delay between batches
      if (i + batchSize < referenceNumbers.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Error fetching batch ${i}-${i + batchSize}:`, error.message);
      // Continue with next batch even if this one failed
    }
  }

  return allItems;
};

// Function to update inventory in database
const updateInventory = async (items) => {
  if (items.length === 0) {
    console.log('No valid items to update');
    return;
  }

  console.log('Starting inventory update...');
  try {
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
    console.log(`Successfully updated ${items.length} items`);
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
};

export async function GET(req) {
  console.log('Starting DM inventory update process...');
  const config = getDMConfig();
  
  try {
    // First get catalog of all items
    const referenceNumbers = await getCatalogItems(config);
    
    if (referenceNumbers.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: {
          itemCount: 0,
          message: 'No items found in catalog',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Then get details in batches
    const items = await getItemDetails(config, referenceNumbers);
    await updateInventory(items);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        itemCount: items.length,
        totalInCatalog: referenceNumbers.length,
        message: items.length > 0 ? 'Inventory updated successfully' : 'No valid items found',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching DM inventory:', error);
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