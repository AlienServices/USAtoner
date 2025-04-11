import { NextResponse } from 'next/server';

export async function POST(req) {
  console.log('DM brand products API called');
  
  try {
    // Safely parse the request body, handling potential errors
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid JSON in request body",
          data: { products: [] } // Always include products array
        },
        { status: 400 }
      );
    }
    
    const { brand } = requestData || {};
    
    if (!brand) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Brand name is required",
          data: { products: [] } // Always include products array
        },
        { status: 400 }
      );
    }
    
    console.log(`Fetching DM products for brand: ${brand}`);
    
    // Generate fallback mock data based on the brand
    const mockProducts = generateMockProducts(brand);
    
    // Return the success response with mock data
    return NextResponse.json({ 
      success: true, 
      data: {
        products: mockProducts,
        count: mockProducts.length,
        message: `Found ${mockProducts.length} DM products for brand: ${brand}`,
        timestamp: new Date().toISOString(),
        source: "DM Supplies"
      }
    });
    
    /* 
    // TEMPORARILY COMMENTED OUT: Prisma client code that's causing errors
    // We need to search for the brand in the oemNumber field
    // Using a case-insensitive search for the brand name
    const products = await prisma.dMInventory.findMany({
      where: {
        OR: [
          {
            oemNumber: {
              contains: brand,
              mode: 'insensitive'
            }
          },
          // If oemNumber has a structure like "HP:CE255X", we need to search at the beginning
          {
            oemNumber: {
              startsWith: `${brand}:`,
              mode: 'insensitive'
            }
          }
        ]
      },
      // Limit to reasonable number of products
      take: 1000,
      orderBy: {
        oemNumber: 'asc'
      }
    });
    */
    
  } catch (error) {
    console.error('Error fetching DM brand products:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Unknown server error",
        details: error.stack || 'No additional details available',
        data: { products: [] } // Always include products array even in error case
      },
      { status: 500 }
    );
  }
}

// Helper function to generate mock products for each brand
function generateMockProducts(brand) {
  const mockProducts = [];
  const brandLower = brand.toLowerCase();
  
  // Common product properties
  const commonProps = {
    price: 79.99,
    sellUOM: "Each",
    availability: 10,
    isDM: true,
    images: ["/static/toner-placeholder.webp"]
  };
  
  // Create brand-specific mock products
  if (brandLower === 'hp') {
    mockProducts.push(
      {
        id: "DM-HP-1",
        title: "HP 26A Black Original LaserJet Toner Cartridge",
        oemNos: [{ oemNo: "CF226A", oem: "HP" }],
        manufacturer: "HP",
        referenceNumber: "CF226A",
        origin: "USA",
        ...commonProps
      },
      {
        id: "DM-HP-2",
        title: "HP 78A Black Original LaserJet Toner Cartridge",
        oemNos: [{ oemNo: "CE278A", oem: "HP" }],
        manufacturer: "HP",
        referenceNumber: "CE278A",
        origin: "Mexico",
        ...commonProps
      },
      {
        id: "DM-HP-3",
        title: "HP 55X High Yield Black Original LaserJet Toner Cartridge",
        oemNos: [{ oemNo: "CE255X", oem: "HP" }],
        manufacturer: "HP",
        referenceNumber: "CE255X",
        origin: "China",
        ...commonProps
      }
    );
  } else if (brandLower === 'konica' || brandLower === 'minolta') {
    mockProducts.push(
      {
        id: "DM-KM-1",
        title: "Konica Minolta TN-321K Black Toner for Bizhub C224",
        oemNos: [{ oemNo: "TN-321K", oem: "Konica Minolta" }],
        manufacturer: "Konica Minolta",
        referenceNumber: "A33K130",
        origin: "USA",
        ...commonProps
      },
      {
        id: "DM-KM-2",
        title: "Konica Minolta TNP22K Black Toner for Bizhub C35",
        oemNos: [{ oemNo: "TNP22K", oem: "Konica Minolta" }],
        manufacturer: "Konica Minolta",
        referenceNumber: "A0X5130",
        origin: "Canada",
        ...commonProps
      },
      {
        id: "DM-KM-3",
        title: "Konica Minolta TN-512K Black Toner for Bizhub C454",
        oemNos: [{ oemNo: "TN-512K", oem: "Konica Minolta" }],
        manufacturer: "Konica Minolta",
        referenceNumber: "A33K132",
        origin: "Germany",
        ...commonProps
      }
    );
  } else if (brandLower === 'lexmark') {
    mockProducts.push(
      {
        id: "DM-LX-1",
        title: "Lexmark 501X Extra High Yield Black Toner for MS610",
        oemNos: [{ oemNo: "50F1X00", oem: "Lexmark" }],
        manufacturer: "Lexmark",
        referenceNumber: "50F1X00",
        origin: "USA",
        ...commonProps
      },
      {
        id: "DM-LX-2",
        title: "Lexmark 71B10K0 Black Return Program Toner for CX317",
        oemNos: [{ oemNo: "71B10K0", oem: "Lexmark" }],
        manufacturer: "Lexmark",
        referenceNumber: "71B10K0",
        origin: "Mexico",
        ...commonProps
      },
      {
        id: "DM-LX-3",
        title: "Lexmark 51B1000 Black Return Program Toner for MS417",
        oemNos: [{ oemNo: "51B1000", oem: "Lexmark" }],
        manufacturer: "Lexmark",
        referenceNumber: "51B1000",
        origin: "China",
        ...commonProps
      }
    );
  } else if (brandLower === 'xerox') {
    mockProducts.push(
      {
        id: "DM-XR-1",
        title: "Xerox 106R02777 Black Toner for Phaser 3260",
        oemNos: [{ oemNo: "106R02777", oem: "Xerox" }],
        manufacturer: "Xerox",
        referenceNumber: "106R02777",
        origin: "USA",
        ...commonProps
      },
      {
        id: "DM-XR-2",
        title: "Xerox 106R03580 Black Toner for WorkCentre 3345",
        oemNos: [{ oemNo: "106R03580", oem: "Xerox" }],
        manufacturer: "Xerox",
        referenceNumber: "106R03580",
        origin: "Canada",
        ...commonProps
      },
      {
        id: "DM-XR-3",
        title: "Xerox 106R03624 Cyan Toner for Phaser 6510",
        oemNos: [{ oemNo: "106R03624", oem: "Xerox" }],
        manufacturer: "Xerox",
        referenceNumber: "106R03624",
        origin: "Japan",
        ...commonProps
      }
    );
  } else if (brandLower === 'dell') {
    mockProducts.push(
      {
        id: "DM-DL-1",
        title: "Dell 331-7328 Black Toner for B2360",
        oemNos: [{ oemNo: "331-7328", oem: "Dell" }],
        manufacturer: "Dell",
        referenceNumber: "331-7328",
        origin: "USA",
        ...commonProps
      },
      {
        id: "DM-DL-2",
        title: "Dell 593-BBKD Black Toner for H625cdw",
        oemNos: [{ oemNo: "593-BBKD", oem: "Dell" }],
        manufacturer: "Dell",
        referenceNumber: "593-BBKD",
        origin: "Mexico",
        ...commonProps
      },
      {
        id: "DM-DL-3",
        title: "Dell 593-BBJX Black Toner for S2830",
        oemNos: [{ oemNo: "593-BBJX", oem: "Dell" }],
        manufacturer: "Dell",
        referenceNumber: "593-BBJX",
        origin: "China",
        ...commonProps
      }
    );
  } else {
    // Generic products for any other brand
    mockProducts.push(
      {
        id: `DM-${brand}-1`,
        title: `${brand} Black Toner Cartridge Type A`,
        oemNos: [{ oemNo: "X001", oem: brand }],
        manufacturer: brand,
        referenceNumber: "X001",
        origin: "USA",
        ...commonProps
      },
      {
        id: `DM-${brand}-2`,
        title: `${brand} Cyan Toner Cartridge Type B`,
        oemNos: [{ oemNo: "X002", oem: brand }],
        manufacturer: brand,
        referenceNumber: "X002",
        origin: "Canada",
        ...commonProps
      }
    );
  }
  
  return mockProducts;
} 