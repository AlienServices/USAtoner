"use client";
import React, { useEffect, useRef, useState, useContext } from "react";
import Header from "../../components/Header";
import Image from "next/image";
import styles from "../../page.module.css";
import Footer from "../../components/Footer";
import Link from "next/link";
import { CartContext } from "../../providers/cart";
import { useSearchParams } from "next/navigation";
import moduleStyles from "./modelSupplies.module.css";

const ModelSupplies = () => {
    const searchParams = useSearchParams();
    const modelNumber = searchParams.get("model");
    const { cart, setCart } = useContext(CartContext);
    const [activeTab, setActiveTab] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [supplies, setSupplies] = useState([]);
    
    // Define HP part number to model mapping at component level
    const partToModelMap = {
        // HP LaserJet 100 Series
        'CE310A': ['M175', 'M175a', 'M175nw', 'CP1025', 'CP1025nw', '100 Color MFP M175nw'],
        'CE311A': ['M175', 'M175a', 'M175nw', 'CP1025', 'CP1025nw', '100 Color MFP M175nw'],
        'CE312A': ['M175', 'M175a', 'M175nw', 'CP1025', 'CP1025nw', '100 Color MFP M175nw'],
        'CE313A': ['M175', 'M175a', 'M175nw', 'CP1025', 'CP1025nw', '100 Color MFP M175nw'],
        'CE314A': ['M175', 'M175a', 'M175nw', 'CP1025', 'CP1025nw', '100 Color MFP M175nw'], // Imaging Drum
        
        // HP LaserJet M1xx Series
        'CF217A': ['M102', 'M102a', 'M102w', 'M130', 'M130a', 'M130fn', 'M130fw', 'M130nw'],
        'CF217X': ['M102', 'M102a', 'M102w', 'M130', 'M130a', 'M130fn', 'M130fw', 'M130nw'],
        'CF218A': ['M132', 'M132a', 'M132fn', 'M132fp', 'M132fw', 'M132nw'],
        'CF218X': ['M132', 'M132a', 'M132fn', 'M132fp', 'M132fw', 'M132nw'],
        'CF219A': ['M102', 'M102a', 'M102w', 'M130', 'M130a', 'M130fn', 'M130fw', 'M130nw', 'M132', 'M132a', 'M132fn', 'M132fp', 'M132fw', 'M132nw'], // Imaging Drum
        
        // HP LaserJet M2xx Series
        'CF283A': ['M125', 'M125a', 'M125nw', 'M125rnw', 'M126', 'M126a', 'M126nw', 'M127', 'M127fn', 'M127fp', 'M127fw', 'M128', 'M128fn', 'M128fp', 'M128fw', 'M225', 'M225dn', 'M225dw', 'M226', 'M226dn', 'M226dw', '200 Series'],
        'CF283X': ['M125', 'M125a', 'M125nw', 'M125rnw', 'M126', 'M126a', 'M126nw', 'M127', 'M127fn', 'M127fp', 'M127fw', 'M128', 'M128fn', 'M128fp', 'M128fw', 'M225', 'M225dn', 'M225dw', 'M226', 'M226dn', 'M226dw', '200 Series'],
        'CF230A': ['M203', 'M203d', 'M203dn', 'M203dw', 'M227', 'M227d', 'M227fdn', 'M227fdw', 'M227sdn', '200 Series'],
        'CF230X': ['M203', 'M203d', 'M203dn', 'M203dw', 'M227', 'M227d', 'M227fdn', 'M227fdw', 'M227sdn', '200 Series'],
        'CF232A': ['M203', 'M203d', 'M203dn', 'M203dw', 'M227', 'M227d', 'M227fdn', 'M227fdw', 'M227sdn', '200 Series'], // Imaging Drum
        
        // Color LaserJet 200 Series
        'CF500A': ['M254', 'M254dw', 'M254nw', 'M281', 'M281cdw', 'M281fdn', 'M281fdw', '200 Color Series'], // Black
        'CF501A': ['M254', 'M254dw', 'M254nw', 'M281', 'M281cdw', 'M281fdn', 'M281fdw', '200 Color Series'], // Cyan
        'CF502A': ['M254', 'M254dw', 'M254nw', 'M281', 'M281cdw', 'M281fdn', 'M281fdw', '200 Color Series'], // Yellow
        'CF503A': ['M254', 'M254dw', 'M254nw', 'M281', 'M281cdw', 'M281fdn', 'M281fdw', '200 Color Series'], // Magenta
        'CF500X': ['M254', 'M254dw', 'M254nw', 'M281', 'M281cdw', 'M281fdn', 'M281fdw', '200 Color Series'], // Black High Yield
        'CF501X': ['M254', 'M254dw', 'M254nw', 'M281', 'M281cdw', 'M281fdn', 'M281fdw', '200 Color Series'], // Cyan High Yield
        'CF502X': ['M254', 'M254dw', 'M254nw', 'M281', 'M281cdw', 'M281fdn', 'M281fdw', '200 Color Series'], // Yellow High Yield
        'CF503X': ['M254', 'M254dw', 'M254nw', 'M281', 'M281cdw', 'M281fdn', 'M281fdw', '200 Color Series'], // Magenta High Yield
        
        // HP LaserJet M4xx Series
        'CF226A': ['M402', 'M402d', 'M402dn', 'M402dne', 'M402dw', 'M402n', 'M426', 'M426dw', 'M426fdn', 'M426fdw', '400 Series'],
        'CF226X': ['M402', 'M402d', 'M402dn', 'M402dne', 'M402dw', 'M402n', 'M426', 'M426dw', 'M426fdn', 'M426fdw', '400 Series'],
        'CF228A': ['M403', 'M403d', 'M403dn', 'M403n', 'M427', 'M427dw', 'M427fdn', 'M427fdw', '400 Series'],
        'CF228X': ['M403', 'M403d', 'M403dn', 'M403n', 'M427', 'M427dw', 'M427fdn', 'M427fdw', '400 Series'],
        'CF258A': ['M404', 'M404dn', 'M404dw', 'M404n', 'M428', 'M428dw', 'M428fdn', 'M428fdw', '400 Series'],
        'CF258X': ['M404', 'M404dn', 'M404dw', 'M404n', 'M428', 'M428dw', 'M428fdn', 'M428fdw', '400 Series'],
        'CF259A': ['M304', 'M404', 'M404dn', 'M404dw', 'M404n', 'M428', 'M428dw', 'M428fdn', 'M428fdw', '400 Series'],
        'CF259X': ['M304', 'M404', 'M404dn', 'M404dw', 'M404n', 'M428', 'M428dw', 'M428fdn', 'M428fdw', '400 Series'],
        'CF276A': ['M404', 'M404dn', 'M404dw', 'M404n', 'M428', 'M428dw', 'M428fdn', 'M428fdw', '400 Series'],
        'CF276X': ['M404', 'M404dn', 'M404dw', 'M404n', 'M428', 'M428dw', 'M428fdn', 'M428fdw', '400 Series'],
        
        // Color LaserJet 400 Series
        'CF410A': ['M452', 'M452dn', 'M452dw', 'M452nw', 'M477', 'M477fdn', 'M477fdw', 'M477fnw', '400 Color Series'], // Black
        'CF411A': ['M452', 'M452dn', 'M452dw', 'M452nw', 'M477', 'M477fdn', 'M477fdw', 'M477fnw', '400 Color Series'], // Cyan
        'CF412A': ['M452', 'M452dn', 'M452dw', 'M452nw', 'M477', 'M477fdn', 'M477fdw', 'M477fnw', '400 Color Series'], // Yellow
        'CF413A': ['M452', 'M452dn', 'M452dw', 'M452nw', 'M477', 'M477fdn', 'M477fdw', 'M477fnw', '400 Color Series'], // Magenta
        'CF410X': ['M452', 'M452dn', 'M452dw', 'M452nw', 'M477', 'M477fdn', 'M477fdw', 'M477fnw', '400 Color Series'], // Black High Yield
        'CF411X': ['M452', 'M452dn', 'M452dw', 'M452nw', 'M477', 'M477fdn', 'M477fdw', 'M477fnw', '400 Color Series'], // Cyan High Yield
        'CF412X': ['M452', 'M452dn', 'M452dw', 'M452nw', 'M477', 'M477fdn', 'M477fdw', 'M477fnw', '400 Color Series'], // Yellow High Yield
        'CF413X': ['M452', 'M452dn', 'M452dw', 'M452nw', 'M477', 'M477fdn', 'M477fdw', 'M477fnw', '400 Color Series'], // Magenta High Yield
        
        // HP LaserJet M600 Series
        'CF281A': ['M604', 'M604dn', 'M604n', 'M605', 'M605dn', 'M605n', 'M605x', 'M606', 'M606dn', 'M606x', 'M630', '600 Series'],
        'CF281X': ['M604', 'M604dn', 'M604n', 'M605', 'M605dn', 'M605n', 'M605x', 'M606', 'M606dn', 'M606x', 'M630', '600 Series'],
        
        // HP DeskJet and ENVY Series (Inkjet)
        '65': ['ENVY 5055', 'ENVY Pro 6455', 'ENVY Pro 6055', 'DeskJet 2655', 'DeskJet 3755', 'ENVY 5000 Series', 'DeskJet 2600 Series'],
        '65XL': ['ENVY 5055', 'ENVY Pro 6455', 'ENVY Pro 6055', 'DeskJet 2655', 'DeskJet 3755', 'ENVY 5000 Series', 'DeskJet 2600 Series'],
        '67': ['ENVY Pro 6055', 'ENVY Pro 6455', 'DeskJet 2755', 'DeskJet Plus 4155', 'ENVY 6000 Series', 'DeskJet 2700 Series'],
        '67XL': ['ENVY Pro 6055', 'ENVY Pro 6455', 'DeskJet 2755', 'DeskJet Plus 4155', 'ENVY 6000 Series', 'DeskJet 2700 Series'],
        
        // HP OfficeJet Series (Inkjet)
        '910': ['OfficeJet 8010', 'OfficeJet 8020', 'OfficeJet 8030', 'OfficeJet Pro 8025', 'OfficeJet Pro 8035', 'OfficeJet 8000 Series'],
        '910XL': ['OfficeJet 8010', 'OfficeJet 8020', 'OfficeJet 8030', 'OfficeJet Pro 8025', 'OfficeJet Pro 8035', 'OfficeJet 8000 Series'],
        '962': ['OfficeJet Pro 9010', 'OfficeJet Pro 9020', 'OfficeJet Pro 9015', 'OfficeJet Pro 9025', 'OfficeJet Pro 9015e', 'OfficeJet Pro 9025e', 'OfficeJet 9000 Series'],
        '962XL': ['OfficeJet Pro 9010', 'OfficeJet Pro 9020', 'OfficeJet Pro 9015', 'OfficeJet Pro 9025', 'OfficeJet Pro 9015e', 'OfficeJet Pro 9025e', 'OfficeJet 9000 Series'],
        
        // Other HP LaserJet Models
        'CF244A': ['M15', 'M15a', 'M15w', 'M28', 'M28a', 'M28w'],
        'CF248A': ['M28', 'M28a', 'M28w'], // Imaging Drum
        'CF256A': ['M436', 'M436n', 'M436nda'],
        'CF256X': ['M436', 'M436n', 'M436nda'],
        'CF277A': ['M305', 'M305d', 'M305dn', 'M405', 'M405dn', 'M405dw', 'M405n', 'M430', 'M430f', 'M430dw'],
        'CF277X': ['M305', 'M305d', 'M305dn', 'M405', 'M405dn', 'M405dw', 'M405n', 'M430', 'M430f', 'M430dw'],
        'CF279A': ['M12', 'M12a', 'M12w', 'M26', 'M26a', 'M26nw'],
        'CF280A': ['Pro 400', 'M401', 'M401dn', 'M401dne', 'M401dw', 'M401n', 'M425', 'M425dn', 'M425dw'],
        'CF280X': ['Pro 400', 'M401', 'M401dn', 'M401dne', 'M401dw', 'M401n', 'M425', 'M425dn', 'M425dw']
    };

    useEffect(() => {
        if (modelNumber) {
            getModelSupplies();
        }
    }, [modelNumber]);

    async function getModelSupplies() {
        try {
            setIsLoading(true);
            let accessToken = null;

            try {
                const tokenData = localStorage.getItem("token");
                if (tokenData) {
                    const aToken = JSON.parse(tokenData);
                    accessToken = aToken?.accessToken;
                }
            } catch (tokenError) {
                console.error('Token retrieval error:', tokenError);
            }
            
            if (!accessToken) {
                console.warn('No authentication token available');
                setIsLoading(false);
                return;
            }

            // First try to get HP products from cache
            let cachedProducts = [];
            try {
                const cachedData = localStorage.getItem("hp");
                if (cachedData) {
                    cachedProducts = JSON.parse(cachedData);
                }
            } catch (cacheErr) {
                console.error('Error loading cached data:', cacheErr);
            }

            // Normalize model number and prepare search patterns
            const normalizedModel = modelNumber.trim().toUpperCase().replace(/^LASERJET\s+|^OFFICEJET\s+|^DESKJET\s+|^HP\s+/i, '');
            
            // Create various patterns to match the model with different prefixes and formats
            const modelVariants = [
                normalizedModel,
                `HP ${normalizedModel}`,
                `LASERJET ${normalizedModel}`,
                `LASERJET PRO ${normalizedModel}`,
                `OFFICEJET ${normalizedModel}`,
                `OFFICEJET PRO ${normalizedModel}`,
                `DESKJET ${normalizedModel}`,
                `ENVY ${normalizedModel}`,
                `ENVY PRO ${normalizedModel}`
            ];
            
            // Extract the base model number (remove letters and suffixes)
            const baseModelMatch = normalizedModel.match(/^([A-Z]+[0-9]+)/i);
            const baseModel = baseModelMatch ? baseModelMatch[1].toUpperCase() : normalizedModel;
            
            // If we have cached products, filter them by model number OR by compatible part numbers
            if (cachedProducts && cachedProducts.length > 0) {
                // First, identify all products with direct model matches in title
                const directModelMatches = cachedProducts.filter(product => {
                    if (!product || !product.title) return false;
                    
                    // Check if product title matches the model
                    const title = product.title.toUpperCase();
                    return modelVariants.some(variant => title.includes(variant));
                });
                
                // Next, find all products that have compatible part numbers for this model
                const partCompatibleProducts = cachedProducts.filter(product => {
                    if (!product || !product.title) return false;
                    
                    // Skip products already matched by title
                    if (directModelMatches.some(m => m.id === product.id)) return false;
                    
                    // Check if any of the product's OEM numbers are in our part-to-model mapping
                    let partMatch = false;
                    
                    if (product.oemNos && Array.isArray(product.oemNos)) {
                        for (const oem of product.oemNos) {
                            if (!oem || !oem.oemNo) continue;
                            
                            const oemNo = oem.oemNo.toUpperCase();
                            
                            // Check each part number mapping
                            for (const [partNumber, compatibleModels] of Object.entries(partToModelMap)) {
                                // Consider the part number if it's an exact match or contains the part number
                                if ((oemNo === partNumber.toUpperCase() || oemNo.includes(partNumber.toUpperCase())) && 
                                    compatibleModels.some(model => {
                                        // Check both exact model matches and base model matches
                                        const modelUpper = model.toUpperCase();
                                        return normalizedModel === modelUpper || 
                                               normalizedModel.startsWith(modelUpper) ||
                                               baseModel === modelUpper ||
                                               baseModel.startsWith(modelUpper);
                                    })) {
                                    partMatch = true;
                                    break;
                                }
                            }
                            
                            if (partMatch) break;
                        }
                    }
                    
                    return partMatch;
                });
                
                // Combine both sets of products, avoiding duplicates
                const allCompatibleProducts = [...directModelMatches];
                
                partCompatibleProducts.forEach(product => {
                    if (!allCompatibleProducts.some(p => p.id === product.id)) {
                        allCompatibleProducts.push(product);
                    }
                });
                
                if (allCompatibleProducts.length > 0) {
                    console.log('Using cached products for model:', modelNumber);
                    
                    // Enhance product titles to show compatibility if not already mentioned
                    const enhancedProducts = allCompatibleProducts.map(product => {
                        // If the product title doesn't already mention the model number
                        if (!modelVariants.some(variant => 
                            product.title.toUpperCase().includes(variant))) {
                            // Get compatibility info for this product
                            const partNumber = extractPartNumber(product);
                            let compatModels = [];
                            
                            // Find compatible models for this part number
                            if (partNumber !== 'N/A' && partToModelMap[partNumber]) {
                                compatModels = partToModelMap[partNumber];
                            }
                            
                            // Add compatibility note to the title if not already included
                            if (compatModels.length > 0) {
                                return {
                                    ...product,
                                    title: `${product.title} (Compatible with HP ${compatModels.slice(0, 3).join(', ')}${compatModels.length > 3 ? '...' : ''})`
                                };
                            }
                            
                            return {
                                ...product,
                                title: `${product.title} (Compatible with HP ${modelNumber})`
                            };
                        }
                        return product;
                    });
                    
                    setSupplies(enhancedProducts);
                    setIsLoading(false);
                    return;
                }
            }

            // If no cached products match or cache is empty, make API request
            for (const searchVariant of [`hp ${modelNumber}`, `laserjet ${modelNumber}`, `laserjet pro ${modelNumber}`]) {
                try {
                    const requestOptions = {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ 
                            token: accessToken, 
                            search: searchVariant
                        })
                    };

                    const response = await fetch('/api/products', requestOptions);
                    
                    if (!response.ok) {
                        console.warn(`Search for ${searchVariant} failed:`, response.status);
                        continue;
                    }
                    
                    const textResponse = await response.text();
                    if (!textResponse || textResponse.trim() === '') {
                        console.warn('Empty response from API');
                        continue;
                    }
                    
                    const data = JSON.parse(textResponse);
                    
                    if (data?.cancel?.products && Array.isArray(data.cancel.products)) {
                        const validProducts = data.cancel.products.filter(product => 
                            product && 
                            product.title && 
                            product.oemNos && 
                            Array.isArray(product.oemNos) && 
                            product.oemNos.length > 0 &&
                            product.serviceLevels && 
                            Array.isArray(product.serviceLevels) && 
                            product.serviceLevels.length > 0 &&
                            modelVariants.some(variant => 
                                product.title.toUpperCase().includes(variant)
                            )
                        );
                        
                        if (validProducts.length > 0) {
                            setSupplies(validProducts);
                            localStorage.setItem(`hp_model_${modelNumber}`, JSON.stringify(validProducts));
                            setIsLoading(false);
                            return;
                        }
                    }
                } catch (apiError) {
                    console.error(`API request failed for ${searchVariant}:`, apiError);
                }
            }
            
            // If we get here, try to load from model-specific cache as last resort
            try {
                const modelCache = localStorage.getItem(`hp_model_${modelNumber}`);
                if (modelCache) {
                    const modelProducts = JSON.parse(modelCache);
                    if (Array.isArray(modelProducts) && modelProducts.length > 0) {
                        setSupplies(modelProducts);
                        setIsLoading(false);
                        return;
                    }
                }
            } catch (cacheErr) {
                console.error('Error loading model cache:', cacheErr);
            }
            
            // If still no results, create fallback products based on known part numbers
            const fallbackProducts = [];
            
            // Check if current model matches any in our part mapping
            for (const [partNumber, compatibleModels] of Object.entries(partToModelMap)) {
                if (compatibleModels.some(model => 
                    modelVariants.some(variant => variant.includes(model)))) {
                    
                    // Add appropriate fallback products
                    if (partNumber.startsWith('CF')) {
                        const isColor = partNumber.endsWith('X');
                        const colorName = isColor ? 'Color' : 'Black';
                        fallbackProducts.push({
                            id: `${partNumber}-fallback`,
                            title: `HP ${colorName} Toner Cartridge (${partNumber}) - Compatible with ${modelNumber}`,
                            oemNos: [{ oemNo: partNumber }],
                            serviceLevels: [{ price: isColor ? 89.99 : 79.99 }],
                            images: ["/static/toner-placeholder.webp"]
                        });
                    }
                }
            }
            
            // If we found specific fallbacks, use them
            if (fallbackProducts.length > 0) {
                setSupplies(fallbackProducts);
            } else {
                // Otherwise use generic fallbacks
                setSupplies([
                    {
                        id: "fallback1",
                        title: `HP LaserJet ${modelNumber} Black Toner Cartridge`,
                        oemNos: [{ oemNo: "HP-TONER-BK" }],
                        serviceLevels: [{ price: 79.99 }],
                        images: ["/static/toner-placeholder.webp"]
                    },
                    {
                        id: "fallback2",
                        title: `HP LaserJet ${modelNumber} Imaging Drum Unit`,
                        oemNos: [{ oemNo: "HP-DRUM" }],
                        serviceLevels: [{ price: 129.99 }],
                        images: ["/static/toner-placeholder.webp"]
                    }
                ]);
            }
            
            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching model supplies:', err);
            setSupplies([]);
            setIsLoading(false);
        }
    }

    // Replace the existing tab navigation and filtering logic with model-based categorization
    const getCategoryFromModel = (modelNumber) => {
        if (!modelNumber) return 'Unknown';
        
        const normalized = modelNumber.toUpperCase();
        
        if (normalized.includes('LASERJET') || normalized.match(/\bLJ\b/) || normalized.match(/^M[0-9]/)) {
            return 'LaserJet';
        } else if (normalized.includes('OFFICEJET') || normalized.match(/\bOJ\b/)) {
            return 'OfficeJet';
        } else if (normalized.includes('DESKJET') || normalized.match(/\bDJ\b/)) {
            return 'DeskJet';
        } else if (normalized.includes('ENVY')) {
            return 'ENVY';
        } else if (normalized.includes('PAGEWIDE')) {
            return 'PageWide';
        } else {
            return 'Other HP';
        }
    };

    // Get unique model series and categories from the supplies
    const getModelSeriesAndCategories = () => {
        if (!supplies || supplies.length === 0) return [];
        
        // Define model series categories with more meaningful names
        const seriesCategories = {
            'LaserJet Pro 100 Series': [],
            'LaserJet Pro 200 Series': [],
            'LaserJet Pro 400 Series': [],
            'LaserJet Enterprise 600 Series': [],
            'LaserJet Enterprise': [],
            'LaserJet Pro MFP': [],
            'Color LaserJet Pro': [],
            'OfficeJet Pro': [],
            'OfficeJet': [],
            'DeskJet': [],
            'ENVY': [],
            'Other HP Models': []
        };
        
        // Map to track which models we've already categorized
        const processedModels = new Set();
        
        // First, convert the partToModelMap into model-to-compatible-parts mapping
        const modelToPartsMap = new Map();
        
        // Build the model-to-parts mapping
        Object.entries(partToModelMap).forEach(([partNumber, models]) => {
            models.forEach(model => {
                if (!modelToPartsMap.has(model)) {
                    modelToPartsMap.set(model, []);
                }
                modelToPartsMap.get(model).push(partNumber);
            });
        });
        
        // Add all models from our part-to-model mapping to the appropriate categories
        modelToPartsMap.forEach((parts, model) => {
            // Skip if already processed
            if (processedModels.has(model)) return;
            
            // Categorize based on model name patterns
            if (/M1[0-9]{2}|CP1[0-9]{3}|100 Series|100 Color/i.test(model)) {
                seriesCategories['LaserJet Pro 100 Series'].push(model);
            } else if (/M2[0-9]{2}|200 Series/i.test(model)) {
                seriesCategories['LaserJet Pro 200 Series'].push(model);
            } else if (/M4[0-9]{2}|400 Series/i.test(model)) {
                seriesCategories['LaserJet Pro 400 Series'].push(model);
            } else if (/M6[0-9]{2}|600 Series/i.test(model)) {
                seriesCategories['LaserJet Enterprise 600 Series'].push(model);
            } else if (/Enterprise/i.test(model)) {
                seriesCategories['LaserJet Enterprise'].push(model);
            } else if (/Color/i.test(model)) {
                seriesCategories['Color LaserJet Pro'].push(model);
            } else if (/MFP/i.test(model) && !/OfficeJet/i.test(model)) {
                seriesCategories['LaserJet Pro MFP'].push(model);
            } else if (/OfficeJet Pro/i.test(model)) {
                seriesCategories['OfficeJet Pro'].push(model);
            } else if (/OfficeJet/i.test(model)) {
                seriesCategories['OfficeJet'].push(model);
            } else if (/DeskJet/i.test(model)) {
                seriesCategories['DeskJet'].push(model);
            } else if (/ENVY/i.test(model)) {
                seriesCategories['ENVY'].push(model);
            } else if (/^M[0-9]/i.test(model)) {
                // Any other M-series models go to LaserJet Pro MFP
                seriesCategories['LaserJet Pro MFP'].push(model);
            } else {
                seriesCategories['Other HP Models'].push(model);
            }
            
            processedModels.add(model);
        });
        
        // Now add models from the current supplies
        supplies.forEach(item => {
            const compatInfo = getCompatibilityInfo(item);
            if (!compatInfo || !compatInfo.compatibleModels || compatInfo.compatibleModels.length === 0) return;
            
            compatInfo.compatibleModels.forEach(model => {
                // Skip empty models or models we've already processed
                if (!model || !model.trim() || processedModels.has(model.trim())) return;
                
                // Mark this model as processed
                processedModels.add(model.trim());
                
                // Categorize based on model name patterns
                if (/M1[0-9]{2}|CP1[0-9]{3}|100 Series|100 Color/i.test(model)) {
                    seriesCategories['LaserJet Pro 100 Series'].push(model);
                } else if (/M2[0-9]{2}|200 Series/i.test(model)) {
                    seriesCategories['LaserJet Pro 200 Series'].push(model);
                } else if (/M4[0-9]{2}|400 Series/i.test(model)) {
                    seriesCategories['LaserJet Pro 400 Series'].push(model);
                } else if (/M6[0-9]{2}|600 Series/i.test(model)) {
                    seriesCategories['LaserJet Enterprise 600 Series'].push(model);
                } else if (/Enterprise/i.test(model)) {
                    seriesCategories['LaserJet Enterprise'].push(model);
                } else if (/Color/i.test(model)) {
                    seriesCategories['Color LaserJet Pro'].push(model);
                } else if (/MFP/i.test(model) && !/OfficeJet/i.test(model)) {
                    seriesCategories['LaserJet Pro MFP'].push(model);
                } else if (/OfficeJet Pro/i.test(model)) {
                    seriesCategories['OfficeJet Pro'].push(model);
                } else if (/OfficeJet/i.test(model)) {
                    seriesCategories['OfficeJet'].push(model);
                } else if (/DeskJet/i.test(model)) {
                    seriesCategories['DeskJet'].push(model);
                } else if (/ENVY/i.test(model)) {
                    seriesCategories['ENVY'].push(model);
                } else if (/^M[0-9]/i.test(model)) {
                    // Any other M-series models go to LaserJet Pro MFP
                    seriesCategories['LaserJet Pro MFP'].push(model);
                } else {
                    seriesCategories['Other HP Models'].push(model);
                }
            });
        });
        
        // Clean up the categories - remove empty ones and sort model names
        const result = [];
        Object.entries(seriesCategories).forEach(([category, models]) => {
            if (models.length > 0) {
                // Sort models within each category
                result.push({
                    category,
                    models: models.sort((a, b) => {
                        // Extract numeric parts for natural sorting
                        const aMatch = a.match(/\d+/);
                        const bMatch = b.match(/\d+/);
                        
                        if (aMatch && bMatch) {
                            return parseInt(aMatch[0]) - parseInt(bMatch[0]);
                        }
                        
                        return a.localeCompare(b);
                    })
                });
            }
        });
        
        return result;
    };

    // Function to set the active tab to a specific model
    const selectModel = (model) => {
        setActiveTab(model);
    };

    // Group supplies by type (used only when no model is selected)
    const groupSuppliesByType = () => {
        if (!supplies || supplies.length === 0) return [];
        
        const groups = {
            'Black Toner Cartridges': [],
            'Color Toner Cartridges': [],
            'Standard Ink Cartridges': [],
            'High-Yield Ink Cartridges': [],
            'Imaging Drums': [],
            'Maintenance Kits': [],
            'Waste Toner Collectors': [],
            'Other Supplies': []
        };
        
        supplies.forEach(item => {
            if (!item || !item.title) return;
            
            const title = item.title.toLowerCase();
            const compatInfo = getCompatibilityInfo(item);
            const partNumber = extractPartNumber(item);
            
            // Check if this is a color toner cartridge based on part number or title
            const isColorToner = 
                (partNumber && /^(CF|CE|CC)[0-9]{3}(C|M|Y|K)/i.test(partNumber)) ||
                (title && (title.includes('cyan') || title.includes('magenta') || 
                           title.includes('yellow') || title.includes('color')));
            
            // Check if this is a high-yield cartridge
            const isHighYield = 
                (compatInfo && compatInfo.supplyType && compatInfo.supplyType.includes('High Yield')) ||
                (partNumber && partNumber.includes('X')) ||
                (title && (title.includes('high yield') || title.includes('high-yield') || 
                           title.includes('xl capacity') || title.includes('xl cartridge')));
                           
            // Determine the appropriate category
            if (compatInfo?.supplyType?.includes('Drum') || title.includes('drum') || title.includes('imaging unit')) {
                groups['Imaging Drums'].push(item);
            } else if (title.includes('maintenance') || title.includes('kit') || title.includes('fuser')) {
                groups['Maintenance Kits'].push(item);
            } else if (title.includes('waste') || title.includes('collection')) {
                groups['Waste Toner Collectors'].push(item);
            } else if (compatInfo?.supplyType?.includes('Toner') || 
                      title.includes('toner') || 
                      (partNumber && /^(CF|CE|CC|Q)[0-9]{3}/i.test(partNumber))) {
                // Sort toners by black vs. color
                if (isColorToner) {
                    groups['Color Toner Cartridges'].push(item);
                } else {
                    groups['Black Toner Cartridges'].push(item);
                }
            } else if (compatInfo?.supplyType?.includes('Ink') || 
                      title.includes('ink') || 
                      (partNumber && (/^[0-9]{2,3}(XL)?$/i.test(partNumber) ||
                                      partNumber.includes('HP')))) {
                // Sort ink by standard vs high yield
                if (isHighYield) {
                    groups['High-Yield Ink Cartridges'].push(item);
                } else {
                    groups['Standard Ink Cartridges'].push(item);
                }
            } else {
                groups['Other Supplies'].push(item);
            }
        });
        
        // Return only groups that have items
        return Object.entries(groups)
            .filter(([_, items]) => items.length > 0)
            .map(([name, items]) => ({ 
                name, 
                items: items.sort((a, b) => {
                    // Sort by part number if available
                    const partA = extractPartNumber(a);
                    const partB = extractPartNumber(b);
                    
                    if (partA !== 'N/A' && partB !== 'N/A') {
                        return partA.localeCompare(partB);
                    }
                    
                    // Otherwise sort by title
                    return a.title?.localeCompare(b.title || '') || 0;
                })
            }));
    };

    // Render the model selector UI with model groups
    const renderModelSelector = () => {
        const modelGroups = getModelSeriesAndCategories();
        
        if (modelGroups.length === 0) {
            return (
                <div className={moduleStyles.noModelGroups}>
                    <p>No model information available for this printer.</p>
                </div>
            );
        }
        
        return (
            <div className={moduleStyles.modelSelectorContainer}>
                {activeTab && (
                    <button 
                        className={moduleStyles.clearFilterButton}
                        onClick={() => setActiveTab(null)}
                    >
                        Show All Supplies
                    </button>
                )}
                
                {modelGroups.map((group) => (
                    <div key={group.category} className={moduleStyles.modelCategoryContainer}>
                        <div className={moduleStyles.modelCategoryHeader}>
                            <span>{group.category}</span>
                            <span className={moduleStyles.modelCategoryCount}>{group.models.length}</span>
                        </div>
                        <div className={moduleStyles.modelsList}>
                            {group.models.map((model) => (
                                <button 
                                    key={model}
                                    className={`${moduleStyles.modelButton} ${activeTab === model ? moduleStyles.activeModelButton : ''}`}
                                    onClick={() => selectModel(model)}
                                >
                                    {model}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Render the supplies list organized by active model or type
    const renderSupplies = () => {
        if (isLoading) {
            return (
                <div className={moduleStyles.loaderContainer}>
                    <div className={moduleStyles.loader}></div>
                </div>
            );
        }
        
        if (supplies.length === 0) {
            return (
                <div className={styles.noSupplies}>
                    <p>No compatible supplies found for this model. Please try another model or contact customer service.</p>
                </div>
            );
        }
        
        // If a specific model is selected, filter supplies by that model
        if (activeTab) {
            const filteredSupplies = supplies.filter(item => {
                const compatInfo = getCompatibilityInfo(item);
                return compatInfo && compatInfo.compatibleModels && compatInfo.compatibleModels.includes(activeTab);
            });
            
            if (filteredSupplies.length === 0) {
                return (
                    <div className={styles.noSupplies}>
                        <p>No supplies found for {activeTab}. Please try another model.</p>
                    </div>
                );
            }
            
            return (
                <div className={styles.suppliesBox}>
                    {filteredSupplies.map((item, index) => {
                        const partNumber = extractPartNumber(item);
                        const compatInfo = getCompatibilityInfo(item);
                        
                        return (
                            <div key={index} className={styles.supplyItem}>
                                {compatInfo && (
                                    <div className={styles.compatibilityBadge}>
                                        {compatInfo.compatibleModels.length > 1 ? 'Compatible with multiple models' : ''}
                                    </div>
                                )}
                                <div className={styles.supplyImage}>
                                    <Image 
                                        src={item.images && item.images[0] ? item.images[0] : "/static/toner-placeholder.webp"} 
                                        alt={item.title || 'HP Supply'} 
                                        width={150} 
                                        height={150} 
                                        style={{ objectFit: 'contain' }}
                                    />
                                </div>
                                <div className={styles.supplyDetails}>
                                    <div className={styles.partNumber}>
                                        Part #: {partNumber !== 'N/A' ? partNumber : 'Unknown'}
                                    </div>
                                    <div className={styles.supplyTitle}>
                                        {item.title || 'HP Supply Item'}
                                    </div>
                                    {compatInfo && (
                                        <div className={styles.compatibilityInfo}>
                                            {compatInfo.description}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.supplyPrice}>
                                    ${item.serviceLevels && item.serviceLevels[0] ? item.serviceLevels[0].price : (item.price || '79.99')}
                                </div>
                                <div className={styles.supplyActions}>
                                    <button 
                                        className={styles.addToCartButton}
                                        onClick={() => {
                                            const updatedCart = [...cart, item];
                                            setCart(updatedCart);
                                            alert('Item added to cart');
                                        }}
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }
        
        // If no model is selected, group supplies by type
        const typeGroups = groupSuppliesByType();
        
        return (
            <div className={moduleStyles.typeGroupsContainer}>
                {typeGroups.map((group) => (
                    <div key={group.name} className={moduleStyles.typeGroup}>
                        <h3 className={moduleStyles.typeGroupHeader} data-count={group.items.length}>
                            {group.name}
                        </h3>
                        <div className={styles.suppliesBox}>
                            {group.items.map((item, index) => {
                                const partNumber = extractPartNumber(item);
                                const compatInfo = getCompatibilityInfo(item);
                                
                                return (
                                    <div key={index} className={styles.supplyItem}>
                                        {compatInfo && (
                                            <div className={styles.compatibilityBadge}>
                                                {compatInfo.compatibleModels.length > 1 ? 'Compatible with multiple models' : ''}
                                            </div>
                                        )}
                                        <div className={styles.supplyImage}>
                                            <Image 
                                                src={item.images && item.images[0] ? item.images[0] : "/static/toner-placeholder.webp"} 
                                                alt={item.title || 'HP Supply'} 
                                                width={150} 
                                                height={150} 
                                                style={{ objectFit: 'contain' }}
                                            />
                                        </div>
                                        <div className={styles.supplyDetails}>
                                            <div className={styles.partNumber}>
                                                Part #: {partNumber !== 'N/A' ? partNumber : 'Unknown'}
                                            </div>
                                            <div className={styles.supplyTitle}>
                                                {item.title || 'HP Supply Item'}
                                            </div>
                                            {compatInfo && (
                                                <div className={styles.compatibilityInfo}>
                                                    {compatInfo.description}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.supplyPrice}>
                                            ${item.serviceLevels && item.serviceLevels[0] ? item.serviceLevels[0].price : (item.price || '79.99')}
                                        </div>
                                        <div className={styles.supplyActions}>
                                            <button 
                                                className={styles.addToCartButton}
                                                onClick={() => {
                                                    const updatedCart = [...cart, item];
                                                    setCart(updatedCart);
                                                    alert('Item added to cart');
                                                }}
                                            >
                                                Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Helper function to extract OEM part number from product
    function extractPartNumber(product) {
        try {
            if (!product) return 'N/A';
            
            // Try to find OEM part number in product object
            let partNumber = 'N/A';
            
            // Check if product has oemNos (this is the structure from the API)
            if (product.oemNos && Array.isArray(product.oemNos)) {
                // For LaserJet toners, look for part numbers with specific formats
                for (const oem of product.oemNos) {
                    if (!oem || !oem.oemNo) continue;
                    
                    const oemNo = oem.oemNo.toUpperCase();
                    
                    // Match HP LaserJet toner cartridge formats (CF###A, CF###X, CE###A, CE###X, etc.)
                    if (/^(CF|CE|CC|Q|W)[0-9]{3}[A-Z]$/i.test(oemNo)) {
                        partNumber = oemNo;
                        break;
                    }
                    
                    // Match HP inkjet cartridge numbers (65, 67, 910, 962, 65XL, etc.)
                    if (/^(65|67|910|962)(XL)?$/i.test(oemNo)) {
                        partNumber = oemNo;
                        break;
                    }
                }
                
                // If we didn't find a specific match, use the first OEM number
                if (partNumber === 'N/A' && product.oemNos.length > 0 && product.oemNos[0].oemNo) {
                    partNumber = product.oemNos[0].oemNo.toUpperCase();
                }
            }
            // Also check for oem_number format (used in some parts of the system)
            else if (product.oem_number && Array.isArray(product.oem_number) && product.oem_number.length > 0) {
                // For LaserJet toners, look for part numbers with specific formats
                for (const oem of product.oem_number) {
                    // Match HP LaserJet toner cartridge formats (CF###A, CF###X, CE###A, CE###X, etc.)
                    if (/^(CF|CE|CC|Q|W)[0-9]{3}[A-Z]$/i.test(oem)) {
                        partNumber = oem.toUpperCase();
                        break;
                    }
                    
                    // Match HP inkjet cartridge numbers (65, 67, 910, 962, 65XL, etc.)
                    if (/^(65|67|910|962)(XL)?$/i.test(oem)) {
                        partNumber = oem.toUpperCase();
                        break;
                    }
                }
                
                // If we didn't find a specific match, use the first OEM number
                if (partNumber === 'N/A' && product.oem_number.length > 0) {
                    partNumber = product.oem_number[0].toUpperCase();
                }
            }
            
            // If we still don't have a part number, try to extract it from the title
            if (partNumber === 'N/A' && product.title) {
                // Look for common HP part number patterns in the title
                const laserjetMatch = product.title.match(/\b(CF|CE|CC|Q|W)[0-9]{3}[A-Z]\b/i);
                if (laserjetMatch) {
                    partNumber = laserjetMatch[0].toUpperCase();
                } else {
                    // Look for inkjet cartridge numbers
                    const inkjetMatch = product.title.match(/\b(65|67|910|962)(XL)?\b/i);
                    if (inkjetMatch) {
                        partNumber = inkjetMatch[0].toUpperCase();
                    }
                }
            }
            
            return partNumber;
        } catch (error) {
            console.error('Error extracting part number:', error);
            return 'N/A';
        }
    }
    
    // Helper function to check if a product is compatible with the current model
    function getCompatibilityInfo(product) {
        try {
            const partNumber = extractPartNumber(product);
            if (!partNumber || partNumber === 'N/A') {
                return null;
            }

            // Safety check to ensure partToModelMap is available
            if (!partToModelMap) {
                console.error('partToModelMap is not defined in getCompatibilityInfo');
                return null;
            }

            // Find the exact part number or a close match
            let partNumberKey = partNumber;
            let compatibleModels = partToModelMap[partNumberKey];
            
            // If not found directly, try looking for base part number without X/A suffix
            if (!compatibleModels) {
                const basePartNumber = partNumber.replace(/[A-Z]$/, '');
                // Try with standard suffix first
                if (partToModelMap[basePartNumber + 'A']) {
                    partNumberKey = basePartNumber + 'A';
                    compatibleModels = partToModelMap[partNumberKey];
                } 
                // Then try high yield suffix
                else if (partToModelMap[basePartNumber + 'X']) {
                    partNumberKey = basePartNumber + 'X';
                    compatibleModels = partToModelMap[partNumberKey];
                }
            }
            
            if (!compatibleModels || compatibleModels.length === 0) {
                return null;
            }

            // Determine the type of supply (toner, ink, drum)
            let supplyType = "Supply";
            if (/^CF|^CE|^CC|^Q|^W/.test(partNumber)) {
                supplyType = partNumber.endsWith('X') ? "High Yield Toner" : "Standard Yield Toner";
                if (partNumber.includes('A') && /drum|imaging/i.test(product.title)) {
                    supplyType = "Imaging Drum";
                }
            } else if (/^\d+$/.test(partNumber) || /^\d+XL$/.test(partNumber)) {
                supplyType = partNumber.endsWith('XL') ? "High Yield Ink Cartridge" : "Standard Ink Cartridge";
            }

            // Create a user-friendly description
            const modelSample = compatibleModels.slice(0, 3).join(', ');
            const moreModelsNote = compatibleModels.length > 3 ? ` and ${compatibleModels.length - 3} more models` : '';
            
            // Generate a series name based on models
            let seriesName = '';
            if (compatibleModels.some(m => m.includes('LaserJet'))) {
                seriesName = 'LaserJet';
            } else if (compatibleModels.some(m => m.includes('OfficeJet'))) {
                seriesName = 'OfficeJet';
            } else if (compatibleModels.some(m => m.includes('DeskJet'))) {
                seriesName = 'DeskJet';
            } else if (compatibleModels.some(m => m.includes('ENVY'))) {
                seriesName = 'ENVY';
            }
            
            return {
                supplyType,
                compatibleModels,
                seriesName,
                partNumber: partNumberKey,
                description: `${supplyType} compatible with ${modelSample}${moreModelsNote}`
            };
        } catch (error) {
            console.error('Error in getCompatibilityInfo:', error);
            return null;
        }
    }

    return (
        <div className={styles.main}>
            <Header />

            <div className={styles.secondSection}>
                <div className={styles.flex}>
                    <div className={styles.mainContainer}>
                        <div className={styles.buttonCenter}>
                            <div className={styles.bubble}>
                                USA Toner
                            </div>
                        </div>
                        <h1>
                            <div className={styles.homepageTitle}>
                                HP Supplies
                            </div>
                        </h1>
                        <div className={moduleStyles.modelNavigation}>
                            <Link href="/hp" className={moduleStyles.backToModels}>
                                &laquo; Back to All Models
                            </Link>
                        </div>
                        <div className={moduleStyles.modelBox}>
                            <h2 className={moduleStyles.modelSubHeader}>
                                {modelNumber.includes('LaserJet') || modelNumber.includes('OfficeJet') || 
                                 modelNumber.includes('DeskJet') || modelNumber.includes('ENVY') ? 
                                 modelNumber : `HP ${modelNumber}`}
                            </h2>
                        </div>
                    </div>
                </div>

                <div className={moduleStyles.contentContainer}>
                    <div className={moduleStyles.sidebarContainer}>
                        <h3 className={moduleStyles.sidebarHeader}>Compatible Models</h3>
                        {renderModelSelector()}
                    </div>
                    <div className={moduleStyles.mainContentContainer}>
                        {renderSupplies()}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ModelSupplies; 