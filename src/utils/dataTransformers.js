// Transform Clover data to our standard format
export function transformCloverData(cloverItem) {
  return {
    oem: cloverItem.oem || '',
    description: cloverItem.description || '',
    price: cloverItem.price || 0,
    images: cloverItem.images || [],
    stock: cloverItem.stock || 0,
    source: 'clover',
    oemNos: cloverItem.oemNos || [{ oemNo: cloverItem.oem }], // Fallback to main OEM
    originalData: cloverItem // Keep original data if needed
  }
}

// Transform FTP (International Toner) data to our standard format
export function transformFTPData(ftpItem) {
  // Extract numeric value from price string and handle any currency symbols
  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    const numericValue = parseFloat(priceStr.replace(/[^0-9.-]+/g, ''));
    return isNaN(numericValue) ? 0 : numericValue;
  };

  // Parse stock value from TotalAvailable
  const parseStock = (stockStr) => {
    if (!stockStr) return 0;
    const numericValue = parseInt(stockStr.toString().replace(/[^0-9-]+/g, ''));
    return isNaN(numericValue) ? 0 : numericValue;
  };

  return {
    oem: ftpItem.PartNo || '', 
    description: ftpItem.Description || ftpItem.ItemDesc || '',
    price: parsePrice(ftpItem.MSRP || ftpItem.UnitPrice),
    images: [], 
    stock: parseStock(ftpItem.TotalAvailable), // Updated to use TotalAvailable
    source: 'international',
    oemNos: [{ oemNo: ftpItem.PartNo || '' }],
    manufacturer: ftpItem.Manufacturer || '',
    weight: ftpItem.Weight || '',
    category: ftpItem.Category || '',
    originalData: ftpItem
  };
}

// Merge and deduplicate items based on OEM number
export function mergeInventory(cloverData, ftpData) {
  console.log('Merging inventory...');
  console.log('Clover items:', cloverData?.length);
  console.log('FTP items:', ftpData?.length);

  // Ensure both arrays exist
  if (!Array.isArray(cloverData) || !Array.isArray(ftpData)) {
    console.error('Invalid data format:', { cloverData, ftpData });
    return [];
  }

  // Transform FTP items and filter by valid OEM numbers
  const transformedFtpItems = ftpData
    .map(item => transformFTPData(item))
    .filter(item => item.oem && item.oem.length > 0);

  // Merge Clover items, marking their source
  const cloverItems = cloverData.map(item => ({
    ...item,
    source: 'clover'
  }));

  // Combine both sets of items
  const mergedItems = [...cloverItems, ...transformedFtpItems];
  
  console.log('Total merged items:', mergedItems.length);
  
  return mergedItems;
} 