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

  try {
    // Extract model information from product titles and descriptions
    const modelMap = new Map();
    
    products.forEach(product => {
      try {
        if (!product || !product.title) return;
        
        // Extract model information from title or description
        let modelInfo = extractModelInfo(product);
        
        if (modelInfo && modelInfo.model) {
          const modelKey = modelInfo.model.trim().toUpperCase();
          
          if (!modelKey) return;
          
          // Get inventory source from product
          const inventorySource = product.inventorySource || 'unknown';
          
          if (!modelMap.has(modelKey)) {
            modelMap.set(modelKey, {
              model: modelInfo.model,
              series: modelInfo.series || '',
              year: modelInfo.year || 0,
              products: [product],
              inventorySources: {
                primary: inventorySource === 'primary' ? 1 : 0,
                distributorMarketplace: inventorySource === 'distributorMarketplace' ? 1 : 0,
                unknown: inventorySource === 'unknown' ? 1 : 0
              }
            });
          } else {
            // Add this product to existing model
            const existingModel = modelMap.get(modelKey);
            
            if (existingModel.products && Array.isArray(existingModel.products)) {
              existingModel.products.push(product);
            } else {
              existingModel.products = [product];
            }
            
            // Update inventory source count
            if (!existingModel.inventorySources) {
              existingModel.inventorySources = {
                primary: 0,
                distributorMarketplace: 0,
                unknown: 0
              };
            }
            existingModel.inventorySources[inventorySource] = 
              (existingModel.inventorySources[inventorySource] || 0) + 1;
            
            // Update year if the new product has a more specific year
            if (modelInfo.year && (!existingModel.year || modelInfo.year < existingModel.year)) {
              existingModel.year = modelInfo.year;
            }
          }
        }
      } catch (productError) {
        console.error("Error processing product in extractPrinterModels:", productError);
      }
    });
    
    // Convert map to array and sort chronologically
    const models = Array.from(modelMap.entries()).map(([_, value]) => value);
    
    // Format model data for UI consumption
    return models.map(model => [
      model.model,
      { 
        count: model.products?.length || 0,
        series: model.series || '',
        year: model.year || 0,
        inventorySources: model.inventorySources || {
          primary: 0,
          distributorMarketplace: 0,
          unknown: 0
        }
      }
    ]).sort((a, b) => {
      // Sort by model name
      return a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' });
    });
  } catch (error) {
    console.error("Error in extractPrinterModels:", error);
    return [];
  }
};

/**
 * Extracts model information from a product
 * @param {object} product - Product object
 * @returns {object} Model information
 */
const extractModelInfo = (product) => {
  const title = removeCloverImaging(product.title || '');
  
  let model = '';
  let series = '';
  let year = 0;
  
  // Brand-specific patterns with better HP detection
  const hpPatterns = [
    // HP LaserJet patterns
    {
      regex: /\b(LaserJet|Color LaserJet)(?:\s+Pro|\s+Enterprise|\s+Managed)?\s+([A-Z][0-9]+[a-z]*(?:-[0-9]+[a-z]*)?)\b/i,
      extractModel: (matches) => matches[2],
      extractSeries: (matches) => matches[1]
    },
    // HP LaserJet M series specific pattern
    {
      regex: /\b(?:HP\s+)?(?:LaserJet|Color LaserJet)(?:\s+Pro|\s+Enterprise)?\s+(M[0-9]{3,4}[a-z]*(?:-[0-9]+[a-z]*)?)\b/i,
      extractModel: (matches) => matches[1],
      extractSeries: () => 'LaserJet'
    },
    // HP LaserJet P series specific pattern
    {
      regex: /\b(?:HP\s+)?(?:LaserJet|Color LaserJet)(?:\s+Pro|\s+Enterprise)?\s+(P[0-9]{3,4}[a-z]*(?:-[0-9]+[a-z]*)?)\b/i,
      extractModel: (matches) => matches[1],
      extractSeries: () => 'LaserJet'
    },
    // HP LaserJet CP series specific pattern
    {
      regex: /\b(?:HP\s+)?(?:LaserJet|Color LaserJet)(?:\s+Pro|\s+Enterprise)?\s+(CP[0-9]{3,4}[a-z]*(?:-[0-9]+[a-z]*)?)\b/i,
      extractModel: (matches) => matches[1],
      extractSeries: () => 'LaserJet'
    },
    // HP OfficeJet patterns
    {
      regex: /\b(OfficeJet|ENVY)(?:\s+Pro)?\s+([0-9]{3,4}[a-z]*(?:-[0-9]+[a-z]*)?)\b/i,
      extractModel: (matches) => matches[2],
      extractSeries: (matches) => matches[1]
    },
    // HP DeskJet patterns
    {
      regex: /\b(DeskJet|PageWide)(?:\s+Pro)?\s+([0-9]{3,4}[a-z]*(?:-[0-9]+[a-z]*)?)\b/i,
      extractModel: (matches) => matches[2],
      extractSeries: (matches) => matches[1]
    },
    // HP Numeric model after series (catch-all pattern)
    {
      regex: /\b(?:HP\s+)?(?:LaserJet|Color LaserJet|OfficeJet|DeskJet|PageWide|ENVY)(?:\s+Pro|\s+Enterprise)?\s+([0-9]{3,4}[a-z]*)\b/i,
      extractModel: (matches) => matches[1],
      extractSeries: (matches, title) => {
        if (title.toLowerCase().includes('laserjet')) return 'LaserJet';
        if (title.toLowerCase().includes('officejet')) return 'OfficeJet';
        if (title.toLowerCase().includes('deskjet')) return 'DeskJet';
        if (title.toLowerCase().includes('pagewide')) return 'PageWide';
        if (title.toLowerCase().includes('envy')) return 'ENVY';
        return 'HP';
      }
    }
  ];
  
  // Brother patterns
  const brotherPatterns = [
    {
      regex: /\b(MFC|DCP|HL)-([A-Z][0-9]+[A-Z]*)\b/i,
      extractModel: (matches) => matches[0],
      extractSeries: (matches) => matches[1]
    }
  ];
  
  // Lexmark patterns
  const lexmarkPatterns = [
    {
      regex: /\b(MS|MX|CS|CX)([0-9]+[a-z]*)\b/i,
      extractModel: (matches) => matches[0],
      extractSeries: (matches) => matches[1]
    },
    // B Series
    {
      regex: /\bLexmark\s+B([0-9]{4}[a-z]*)\b/i,
      extractModel: (matches) => `Lexmark B${matches[1]}`,
      extractSeries: () => 'B Series'
    },
    // X Series
    {
      regex: /\bLexmark\s+X([0-9]{3,4}[a-z]*)\b/i,
      extractModel: (matches) => `Lexmark X${matches[1]}`,
      extractSeries: () => 'X Series'
    },
    // T Series
    {
      regex: /\bLexmark\s+T([0-9]{3,4}[a-z]*)\b/i, 
      extractModel: (matches) => `Lexmark T${matches[1]}`,
      extractSeries: () => 'T Series'
    },
    // E Series
    {
      regex: /\bLexmark\s+E([0-9]{3,4}[a-z]*)\b/i,
      extractModel: (matches) => `Lexmark E${matches[1]}`,
      extractSeries: () => 'E Series'
    },
    // Match toner part numbers to common models
    {
      regex: /\b([0-9]{2}[A-Z][0-9]{4})\b/i,
      extractModel: (matches) => {
        // Map common Lexmark toner numbers to models
        const tonerToModel = {
          '50F1000': 'MS310',
          '50F1X00': 'MS610',
          '51B1000': 'MS417',
          '71B10K0': 'CX317'
        };
        return tonerToModel[matches[1].toUpperCase()] || `Lexmark ${matches[1]}`;
      },
      extractSeries: (matches) => {
        const model = matches[1].toUpperCase();
        if (model.startsWith('5')) return 'MS Series';
        if (model.startsWith('7')) return 'CX Series';
        return 'Lexmark';
      }
    }
  ];
  
  // Konica Minolta patterns
  const konicaPatterns = [
    // Bizhub models
    {
      regex: /\b(?:Konica\s+Minolta\s+)?(?:bizhub|BIZHUB)\s+([A-Z]?[0-9]+[a-z]*(?:-[0-9]+[a-z]*)?)\b/i,
      extractModel: (matches) => `Bizhub ${matches[1]}`,
      extractSeries: () => 'Bizhub'
    },
    // Magicolor models
    {
      regex: /\b(?:Konica\s+Minolta\s+)?(?:magicolor|MAGICOLOR)\s+([0-9]+[a-z]*(?:-[0-9]+[a-z]*)?)\b/i,
      extractModel: (matches) => `Magicolor ${matches[1]}`,
      extractSeries: () => 'Magicolor'
    },
    // PagePro models
    {
      regex: /\b(?:Konica\s+Minolta\s+)?(?:pagepro|PAGEPRO)\s+([0-9]+[a-z]*(?:-[0-9]+[a-z]*)?)\b/i,
      extractModel: (matches) => `PagePro ${matches[1]}`,
      extractSeries: () => 'PagePro'
    },
    // Generic Konica model pattern for OEM numbers
    {
      regex: /\b(?:TN|TNP|A0[A-Z][0-9])([0-9]{3}[A-Z]?)\b/i,
      extractModel: (matches) => `Konica ${matches[0]}`,
      extractSeries: () => 'Konica Minolta'
    }
  ];
  
  // Xerox patterns
  const xeroxPatterns = [
    // Phaser models
    {
      regex: /\b(?:Xerox\s+)?(?:Phaser|PHASER)\s+([0-9]{4}[A-Z]?)\b/i,
      extractModel: (matches) => `Phaser ${matches[1]}`,
      extractSeries: () => 'Phaser'
    },
    // WorkCentre models
    {
      regex: /\b(?:Xerox\s+)?(?:WorkCentre|WORKCENTRE)\s+([0-9]{4}[A-Z]?)\b/i,
      extractModel: (matches) => `WorkCentre ${matches[1]}`,
      extractSeries: () => 'WorkCentre'
    },
    // VersaLink models
    {
      regex: /\b(?:Xerox\s+)?(?:VersaLink|VERSALINK)\s+([A-Z][0-9]{3}[A-Z]?)\b/i,
      extractModel: (matches) => `VersaLink ${matches[1]}`,
      extractSeries: () => 'VersaLink'
    },
    // AltaLink models
    {
      regex: /\b(?:Xerox\s+)?(?:AltaLink|ALTALINK)\s+([A-Z][0-9]{4}[A-Z]?)\b/i,
      extractModel: (matches) => `AltaLink ${matches[1]}`,
      extractSeries: () => 'AltaLink'
    },
    // DocuPrint models
    {
      regex: /\b(?:Xerox\s+)?(?:DocuPrint|DOCUPRINT)\s+([A-Z]?[0-9]{2,4}[A-Z]?)\b/i,
      extractModel: (matches) => `DocuPrint ${matches[1]}`,
      extractSeries: () => 'DocuPrint'
    },
    // Match toner part numbers to common models
    {
      regex: /\b(106R[0-9]{5})\b/i,
      extractModel: (matches) => {
        // Map common Xerox toner numbers to models
        const tonerToModel = {
          '106R02777': 'Phaser 3260',
          '106R03580': 'WorkCentre 3345',
          '106R03624': 'Phaser 6510'
        };
        return tonerToModel[matches[1]] || `Xerox ${matches[1]}`;
      },
      extractSeries: (matches) => 'Xerox'
    }
  ];
  
  // Dell patterns
  const dellPatterns = [
    // B Series
    {
      regex: /\b(?:Dell\s+)?B([0-9]{4}[A-Z]?)\b/i,
      extractModel: (matches) => `B${matches[1]}`,
      extractSeries: () => 'B Series'
    },
    // C Series
    {
      regex: /\b(?:Dell\s+)?C([0-9]{4}[A-Z]?)\b/i,
      extractModel: (matches) => `C${matches[1]}`,
      extractSeries: () => 'C Series'
    },
    // E Series
    {
      regex: /\b(?:Dell\s+)?E([0-9]{3}[A-Z]?)\b/i,
      extractModel: (matches) => `E${matches[1]}`,
      extractSeries: () => 'E Series'
    },
    // H Series
    {
      regex: /\b(?:Dell\s+)?H([0-9]{3}[A-Z]?)\b/i,
      extractModel: (matches) => `H${matches[1]}`,
      extractSeries: () => 'H Series'
    },
    // S Series
    {
      regex: /\b(?:Dell\s+)?S([0-9]{4}[A-Z]?)\b/i,
      extractModel: (matches) => `S${matches[1]}`,
      extractSeries: () => 'S Series'
    },
    // Match Dell toner part numbers to models
    {
      regex: /\b((?:331|332|593)-[A-Z0-9]{4,5})\b/i,
      extractModel: (matches) => {
        // Map common Dell toner numbers to models
        const tonerToModel = {
          '331-7328': 'B2360',
          '593-BBKD': 'H625cdw',
          '593-BBJX': 'S2830'
        };
        return tonerToModel[matches[1]] || `Dell ${matches[1]}`;
      },
      extractSeries: () => 'Dell'
    }
  ];
  
  // Determine which brand-specific patterns to use based on product information
  let brandPatterns = [];
  
  // Check title for brand indicators
  const titleLowerCase = title.toLowerCase();
  if (titleLowerCase.includes('hp') || 
      titleLowerCase.includes('laserjet') || 
      titleLowerCase.includes('officejet') ||
      titleLowerCase.includes('deskjet') ||
      titleLowerCase.includes('pagewide') ||
      titleLowerCase.includes('envy')) {
    brandPatterns = hpPatterns;
  } else if (titleLowerCase.includes('brother') || 
             titleLowerCase.includes('mfc-') || 
             titleLowerCase.includes('dcp-') ||
             titleLowerCase.includes('hl-')) {
    brandPatterns = brotherPatterns;
  } else if (titleLowerCase.includes('lexmark')) {
    brandPatterns = lexmarkPatterns;
  } else if (titleLowerCase.includes('konica') || 
             titleLowerCase.includes('minolta') ||
             titleLowerCase.includes('bizhub') ||
             titleLowerCase.includes('magicolor') ||
             titleLowerCase.includes('pagepro')) {
    brandPatterns = konicaPatterns;
  } else if (titleLowerCase.includes('xerox')) {
    brandPatterns = xeroxPatterns;
  } else if (titleLowerCase.includes('dell')) {
    brandPatterns = dellPatterns;
  }
  
  // Also check OEM part numbers for brand indicators
  if (!brandPatterns.length && product.oemNos && Array.isArray(product.oemNos)) {
    const oemNos = product.oemNos.map(oem => (oem.oemNo || '').toLowerCase());
    
    if (oemNos.some(oemNo => oemNo.startsWith('cf') || oemNo.startsWith('ce') || oemNo.startsWith('cc'))) {
      // HP toner cartridges typically start with CF, CE, or CC
      brandPatterns = hpPatterns;
    } else if (oemNos.some(oemNo => oemNo.startsWith('tn-') || oemNo.startsWith('dr-'))) {
      // Brother toner cartridges typically start with TN- or DR-
      brandPatterns = brotherPatterns;
    } else if (oemNos.some(oemNo => oemNo.startsWith('tn') || oemNo.startsWith('a0'))) {
      // Konica Minolta toner cartridges often start with TN or A0
      brandPatterns = konicaPatterns;
    } else if (oemNos.some(oemNo => oemNo.startsWith('106r') || oemNo.includes('phaser') || oemNo.includes('workcentre'))) {
      // Xerox toner cartridges often start with 106R
      brandPatterns = xeroxPatterns;
    } else if (oemNos.some(oemNo => oemNo.match(/^[0-9]{2}[a-z][0-9]{4}/i) || oemNo.includes('ms') || oemNo.includes('mx'))) {
      // Lexmark toner cartridges often have formats like 50F1000
      brandPatterns = lexmarkPatterns;
    } else if (oemNos.some(oemNo => oemNo.match(/^(?:331|332|593)-/i) || oemNo.includes('dell'))) {
      // Dell toner cartridges often start with 331-, 332-, or 593-
      brandPatterns = dellPatterns;
    }
  }
  
  // If we couldn't determine the brand, use all patterns
  if (!brandPatterns.length) {
    brandPatterns = [...hpPatterns, ...brotherPatterns, ...lexmarkPatterns, ...konicaPatterns, ...xeroxPatterns, ...dellPatterns];
  }
  
  // Try to match with brand-specific patterns
  for (const pattern of brandPatterns) {
    const matches = title.match(pattern.regex);
    if (matches) {
      model = pattern.extractModel(matches);
      // Check if extractSeries expects title as a parameter
      series = typeof pattern.extractSeries === 'function' && 
               pattern.extractSeries.length > 1 ? 
               pattern.extractSeries(matches, title) : 
               pattern.extractSeries(matches);
      break;
    }
  }
  
  // If no matches found with brand patterns, try generic model extraction
  if (!model) {
    // Look for HP printer models in specific formats (excluding part numbers)
    const hpModelMatch = title.match(/\b(?:HP\s+)?(?:LaserJet|Color LaserJet|OfficeJet|DeskJet|PageWide|ENVY)(?:\s+Pro|\s+Enterprise)?\s+([A-Z0-9]+(?:-[0-9]+[a-z]*)?)\b/i);
    
    if (hpModelMatch) {
      model = hpModelMatch[1];
      
      // Determine series
      if (title.toLowerCase().includes('laserjet')) {
        series = 'LaserJet';
      } else if (title.toLowerCase().includes('officejet')) {
        series = 'OfficeJet';
      } else if (title.toLowerCase().includes('deskjet')) {
        series = 'DeskJet';
      } else if (title.toLowerCase().includes('pagewide')) {
        series = 'PageWide';
      } else if (title.toLowerCase().includes('envy')) {
        series = 'ENVY';
      }
    }
    
    // Look for Konica Minolta models if no HP match
    if (!model) {
      const konicaModelMatch = title.match(/\b(?:Konica\s+Minolta\s+)?(?:Bizhub|BIZHUB|Magicolor|MAGICOLOR|PagePro|PAGEPRO)\s+([A-Z0-9]+(?:-[0-9]+[a-z]*)?)\b/i);
      
      if (konicaModelMatch) {
        model = konicaModelMatch[0]; // Use the full match including "Bizhub" etc.
        
        // Determine series
        if (title.toLowerCase().includes('bizhub')) {
          series = 'Bizhub';
        } else if (title.toLowerCase().includes('magicolor')) {
          series = 'Magicolor';
        } else if (title.toLowerCase().includes('pagepro')) {
          series = 'PagePro';
        } else {
          series = 'Konica Minolta';
        }
      }
    }
    
    // Look for Xerox models if no match yet
    if (!model) {
      const xeroxModelMatch = title.match(/\b(?:Xerox\s+)?(?:Phaser|PHASER|WorkCentre|WORKCENTRE|VersaLink|VERSALINK|AltaLink|ALTALINK)\s+([A-Z0-9]+(?:-[0-9]+[a-z]*)?)\b/i);
      
      if (xeroxModelMatch) {
        model = xeroxModelMatch[0]; // Use the full match including series name
        
        // Determine series
        if (title.toLowerCase().includes('phaser')) {
          series = 'Phaser';
        } else if (title.toLowerCase().includes('workcentre')) {
          series = 'WorkCentre';
        } else if (title.toLowerCase().includes('versalink')) {
          series = 'VersaLink';
        } else if (title.toLowerCase().includes('altalink')) {
          series = 'AltaLink';
        } else {
          series = 'Xerox';
        }
      }
    }
    
    // Look for Lexmark models if no match yet
    if (!model) {
      const lexmarkModelMatch = title.match(/\b(?:Lexmark\s+)?(?:MS|MX|CS|CX|B|T|E|X)[0-9]{3,4}[a-z]*\b/i);
      
      if (lexmarkModelMatch) {
        model = lexmarkModelMatch[0]; // Use the full match
        
        // Determine series
        const modelPrefix = model.match(/^(?:Lexmark\s+)?([A-Z]+)/i);
        if (modelPrefix && modelPrefix[1]) {
          const prefix = modelPrefix[1].toUpperCase();
          if (prefix === 'MS' || prefix === 'MX') {
            series = `${prefix} Series`;
          } else if (prefix === 'CS' || prefix === 'CX') {
            series = `${prefix} Series`;
          } else {
            series = `${prefix} Series`;
          }
        } else {
          series = 'Lexmark';
        }
      }
    }
    
    // Look for Dell models if no match yet
    if (!model) {
      const dellModelMatch = title.match(/\b(?:Dell\s+)?(?:B|C|E|H|S)[0-9]{3,4}[a-z]*\b/i);
      
      if (dellModelMatch) {
        model = dellModelMatch[0]; // Use the full match
        
        // Determine series
        const modelPrefix = model.match(/^(?:Dell\s+)?([A-Z])/i);
        if (modelPrefix && modelPrefix[1]) {
          series = `${modelPrefix[1]} Series`;
        } else {
          series = 'Dell';
        }
      }
    }
  }
  
  // Specifically exclude part numbers that look like models
  if (model) {
    // Exclude HP toner part numbers (typically CF###X, CE###X, etc.)
    if (/^(CF|CE|CC)[0-9]{3}[A-Z]?$/i.test(model)) {
      model = '';
      series = '';
    }
    
    // Exclude other common part number formats
    if (/^[0-9]{4}-[0-9]{3}$/i.test(model)) {
      model = '';
      series = '';
    }
  }
  
  // Look for year indicators
  const yearMatch = title.match(/\b(20[0-9]{2})\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[1]);
  }
  
  return { model, series, year };
}; 