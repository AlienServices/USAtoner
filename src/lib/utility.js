/**
 * Utility functions for the application
 */

/**
 * Removes "Clover Imaging" from product titles
 * @param {string} title - The product title to process
 * @returns {string} The title with "Clover Imaging" removed
 */
export const removeCloverImaging = (title) => {
  if (!title) return '';
  return title.replace(/clover imaging/gi, '').trim();
};

/**
 * Extracts unique printer models from products and sorts them chronologically
 * @param {array} products - Array of product objects
 * @returns {array} Sorted array of unique printer model objects
 */
export const extractPrinterModels = (products) => {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return [];
  }

  // Extract model information from product titles and descriptions
  const modelMap = new Map();
  
  products.forEach(product => {
    if (!product.title) return;
    
    // Extract model information from title or description
    let modelInfo = extractModelInfo(product);
    
    if (modelInfo.model) {
      if (!modelMap.has(modelInfo.model)) {
        modelMap.set(modelInfo.model, {
          model: modelInfo.model,
          series: modelInfo.series || '',
          year: modelInfo.year || 0,
          products: [product]
        });
      } else {
        // Add this product to existing model
        const existingModel = modelMap.get(modelInfo.model);
        existingModel.products.push(product);
        
        // Update year if the new product has a more specific year
        if (modelInfo.year && (!existingModel.year || modelInfo.year < existingModel.year)) {
          existingModel.year = modelInfo.year;
        }
      }
    }
  });
  
  // Convert map to array and sort chronologically
  const models = Array.from(modelMap.values());
  
  return models.sort((a, b) => {
    // First sort by series
    if (a.series !== b.series) {
      return a.series.localeCompare(b.series);
    }
    
    // Then by year if available
    if (a.year !== b.year) {
      return a.year - b.year;
    }
    
    // Finally by model number
    return a.model.localeCompare(b.model, undefined, { numeric: true, sensitivity: 'base' });
  });
};

/**
 * Extracts model information from a product
 * @param {object} product - Product object
 * @returns {object} Model information
 */
const extractModelInfo = (product) => {
  const title = removeCloverImaging(product.title || '');
  
  // This is a simplified version - would need customization per brand's naming convention
  // Example patterns for different brands:
  // HP: "LaserJet Pro M402n", "OfficeJet Pro 9015e"
  // Brother: "MFC-L8900CDW", "HL-L2370DW"
  // Lexmark: "MS811dn", "CX725de"
  
  let model = '';
  let series = '';
  let year = 0;
  
  // Common printer model patterns
  const modelPatterns = [
    // HP LaserJet Pattern
    {
      regex: /\b(LaserJet|OfficeJet|DeskJet|PageWide)(?:\s+Pro|\s+Enterprise)?\s+([A-Z][0-9]+[a-z]*(?:-[0-9]+[a-z]*)?)\b/i,
      extractModel: (matches) => matches[2],
      extractSeries: (matches) => matches[1]
    },
    // Brother Pattern
    {
      regex: /\b(MFC|DCP|HL)-([A-Z][0-9]+[A-Z]*)\b/i,
      extractModel: (matches) => matches[0],
      extractSeries: (matches) => matches[1]
    },
    // Lexmark Pattern
    {
      regex: /\b(MS|MX|CS|CX)([0-9]+[a-z]*)\b/i,
      extractModel: (matches) => matches[0],
      extractSeries: (matches) => matches[1]
    },
    // Generic Pattern
    {
      regex: /\b([A-Z]+-?[0-9]+[A-Z0-9]*)\b/i,
      extractModel: (matches) => matches[1],
      extractSeries: () => ''
    }
  ];
  
  // Try to match model patterns
  for (const pattern of modelPatterns) {
    const matches = title.match(pattern.regex);
    if (matches) {
      model = pattern.extractModel(matches);
      series = pattern.extractSeries(matches);
      break;
    }
  }
  
  // Look for year indicators - this is simplified
  const yearMatch = title.match(/\b(20[0-9]{2})\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[1]);
  }
  
  return { model, series, year };
}; 