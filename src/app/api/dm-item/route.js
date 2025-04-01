import axios from 'axios';
import { NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';

// Helper function to get DM API configuration
const getDMConfig = () => ({
  apiKey: process.env.DM_API_KEY || '0751E703-3D4D-4B37-9156-088F43AECBDB',
  isa: process.env.DM_ISA || '4012025D2D',
  orgId: process.env.DM_ORG_ID || '4012025',
  contactId: process.env.DM_CONTACT_ID || '6043937',
  agreementScheduleId: process.env.DM_AGREEMENT_SCHEDULE_ID || 'QT23-090684'
});

// Function to build SOAP request body for RequestInfo for specific items
const buildRequestInfoBody = (config, items) => {
  // Generate item nodes based on the provided information
  const itemNodes = items.map(item => {
    if (item.oemNumber && item.referenceNumber) {
      return `<dmi:Item OEMNumber="${item.oemNumber}" ReferenceNumber="${item.referenceNumber}"></dmi:Item>`;
    } else if (item.oemNumber) {
      return `<dmi:Item OEMNumber="${item.oemNumber}"></dmi:Item>`;
    } else if (item.referenceNumber) {
      return `<dmi:Item ReferenceNumber="${item.referenceNumber}"></dmi:Item>`;
    }
    return '';
  }).filter(node => node !== '').join('\n');
  
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <RequestInfo xmlns="http://portal.suppliesnet.net">
      <InputRequestNode>
        <dmi:ItemInformation GetPrice="1" GetAvailability="1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dmi="http://portal.suppliesnet.net">
          <dmi:ContactID>${config.contactId}</dmi:ContactID>
          <dmi:APIKey>${config.apiKey}</dmi:APIKey>
          <dmi:ZipCode></dmi:ZipCode>
          <dmi:Items>
            ${itemNodes}
          </dmi:Items>
          <dmi:AgreementSchedule>${config.agreementScheduleId}</dmi:AgreementSchedule>
        </dmi:ItemInformation>
      </InputRequestNode>
    </RequestInfo>
  </soap:Body>
</soap:Envelope>`;
};

// Function to check for errors in DM API response
const checkForErrors = (result) => {
  const errors = result?.['soap:Envelope']?.['soap:Body']?.[0]?.['soap:Fault'] || 
                result?.['soap:Envelope']?.['soap:Body']?.[0]?.RequestInfoResponse?.[0]?.RequestInfoResult?.[0]?.['dmi:ItemInformation']?.[0]?.['dmi:Errors']?.[0]?.['dmi:Error'];
  
  if (errors) {
    const errorNumber = errors[0]?.ErrorNumber?.[0] || errors[0]?.['dmi:ErrorNumber']?.[0] || 'Unknown';
    const errorDesc = errors[0]?.ErrorDescription?.[0] || errors[0]?.['dmi:ErrorDescription']?.[0] || 'Unknown Error';
    throw new Error(`DM API Error ${errorNumber}: ${errorDesc}`);
  }
};

// Function to get item details
const getItemDetails = async (config, items) => {
  if (!items || items.length === 0) {
    throw new Error("No items specified for lookup");
  }

  const headers = {
    'Content-Type': 'text/xml; charset=utf-8',
    'SOAPAction': '"http://portal.suppliesnet.net/RequestInfo"'
  };

  console.log(`Fetching details for ${items.length} items from DM API`);
  const requestBody = buildRequestInfoBody(config, items);
  console.log("Request body:", requestBody);
  
  const response = await axios.post(
    'https://portal.suppliesnet.net/CatalogRequest/CatalogRequest.asmx',
    requestBody,
    { headers, timeout: 30000 }
  );

  console.log('Raw response received:', response.data.substring(0, 500) + '...');
  const result = await parseStringPromise(response.data);
  
  // Check for errors
  checkForErrors(result);
  
  // Extract items from the response
  const resultItems = result?.['soap:Envelope']?.['soap:Body']?.[0]?.RequestInfoResponse?.[0]?.RequestInfoResult?.[0]?.['dmi:ItemInformation']?.[0]?.['dmi:Items']?.[0]?.['dmi:Item'] || [];
  
  console.log(`Found ${resultItems.length} items in the response`);
  
  // Transform items to a more usable format
  return resultItems.map(item => {
    const price = parseFloat(item['dmi:Price']?.[0]) || 0;
    const availability = parseInt(item['dmi:Availability']?.[0]) || 0;
    
    return {
      referenceNumber: item.$.ReferenceNumber,
      oemNumber: item.$.OEMNumber || null,
      sellUOM: item.$.SellUOM,
      description: item.$.Description,
      isValid: !(price === -1 || availability === -1),
      price: price,
      availability: {
        dc: 'default',
        quantity: availability
      }
    };
  });
};

export async function POST(req) {
  console.log('DM item lookup API called');
  
  try {
    const config = getDMConfig();
    const requestData = await req.json();
    
    if (!requestData.items || !Array.isArray(requestData.items) || requestData.items.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "No items specified for lookup"
        },
        { status: 400 }
      );
    }
    
    // Get details for the specified items
    const items = await getItemDetails(config, requestData.items);
    
    if (items.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: {
          items: [],
          message: 'No items found matching the criteria',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: {
        items: items,
        message: `Found ${items.length} items`,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error looking up DM items:', error);
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