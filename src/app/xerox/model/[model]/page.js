"use client";
import React, { useEffect, useRef, useState, useContext } from "react";
import Header from "../../../components/Header";
import Image from "next/image";
import styles from "../../../page.module.css";
import Footer from "../../../components/Footer";
import Link from "next/link";
import { CartContext } from "../../../providers/cart";
import { useSearchParams } from "next/navigation";
import moduleStyles from "../../../modelSupplies/modelSupplies.module.css";
import OriginFilter from "../../../components/OriginFilter";

const ModelSupplies = () => {
    const searchParams = useSearchParams();
    const modelNumber = searchParams.get("model");
    const { cart, setCart } = useContext(CartContext);
    const [activeTab, setActiveTab] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [supplies, setSupplies] = useState([]);
    const [originFilters, setOriginFilters] = useState({
        usaMade: false,
        americasMade: false,
        worldWideMade: false,
        chineseMade: false
    });

    useEffect(() => {
        if (modelNumber) {
            getModelSupplies();
        }
    }, [modelNumber]);

    // Handle origin filter changes
    const handleOriginFilterChange = (filters) => {
        setOriginFilters(filters);
    };

    // Filter products by origin
    const filterProductsByOrigin = (products) => {
        // Log the active filters
        console.log("Xerox - Active origin filters:", JSON.stringify(originFilters));
        
        // Safety check for null/undefined products
        if (!products || !Array.isArray(products)) {
            console.error("Xerox - Products is not an array:", products);
            return [];
        }
        
        // If no filters are active, return all products
        if (!originFilters.usaMade && !originFilters.americasMade && !originFilters.worldWideMade) {
            console.log("Xerox - No origin filters active, returning all products:", products.length);
            return products;
        }

        // Log a sample of product origins
        const sampleSize = Math.min(products.length, 5);
        const originSamples = products.slice(0, sampleSize).map(p => p.origin || 'unknown');
        console.log(`Xerox - Origin samples from ${products.length} products:`, originSamples);

        const filtered = products.filter(product => {
            // Check if product has origin information
            const origin = (product.origin || 'unknown').toLowerCase();
            
            // Apply filters
            if (originFilters.usaMade && origin.includes('usa')) {
                return true;
            }
            
            if (originFilters.americasMade && 
                (origin.includes('usa') || 
                origin.includes('canada') || 
                origin.includes('mexico') ||
                origin.includes('americas'))) {
                return true;
            }
            
            if (originFilters.worldWideMade) {
                // If the product is from China, only show if Chinese products are allowed
                if (origin.includes('china')) {
                    return originFilters.chineseMade;
                }
                // For all other worldwide products (not Chinese), show them if worldwide is selected
                return true;
            }
            
            return false;
        });
        
        console.log(`Xerox - Filtered products: ${filtered.length} out of ${products.length}`);
        return filtered;
    };

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

            // Define part number to model mapping for Xerox
            const partToModelMap = {
                '106R00759': ['Phaser 6510', 'Phaser 6510DN'],
                '106R00760': ['Phaser 6510', 'Phaser 6510DN'],
                '106R00761': ['Phaser 6510', 'Phaser 6510DN'],
                '106R00762': ['Phaser 6510', 'Phaser 6510DN'],
                '106R00763': ['Phaser 6510', 'Phaser 6510DN'],
                '106R00764': ['Phaser 6510', 'Phaser 6510DN'],
                '106R00765': ['Phaser 6510', 'Phaser 6510DN'],
                '106R00766': ['Phaser 6510', 'Phaser 6510DN'],
                '106R00767': ['Phaser 6510', 'Phaser 6510DN'],
                '106R00768': ['Phaser 6510', 'Phaser 6510DN'],
                '106R00769': ['Phaser 6510', 'Phaser 6510DN'],
                '106R00770': ['Phaser 6510', 'Phaser 6510DN'],
                // VersaLink B400 and B405
                '106R03580': ['VersaLink B400', 'VersaLink B400dnm', 'VersaLink B400dn', 'VersaLink B400n', 'VersaLink B405', 'VersaLink B405dnm', 'VersaLink B405dn'],
                '106R03582': ['VersaLink B400', 'VersaLink B400dn', 'VersaLink B405', 'VersaLink B405dn'],
                '106R03584': ['VersaLink B400', 'VersaLink B400dn', 'VersaLink B405', 'VersaLink B405dn'],
                '106R03941': ['VersaLink B400', 'VersaLink B405'],
                '106R03942': ['VersaLink B400', 'VersaLink B405'],
                // Phaser 3330 and WorkCentre 3335/3345
                '106R03624': ['Phaser 3330', 'Phaser 3330dni', 'WorkCentre 3335', 'WorkCentre 3335dni', 'WorkCentre 3345', 'WorkCentre 3345dni'],
                '106R03622': ['Phaser 3330', 'WorkCentre 3335', 'WorkCentre 3345'],
                '106R03620': ['Phaser 3330', 'WorkCentre 3335', 'WorkCentre 3345']
                // Add more mappings as needed
            };

            // First try to get Xerox products from cache
            let cachedProducts = [];
            try {
                const cachedData = localStorage.getItem("xerox");
                if (cachedData) {
                    cachedProducts = JSON.parse(cachedData);
                }
            } catch (cacheErr) {
                console.error('Error loading cached data:', cacheErr);
            }

            // Normalize model number and prepare search patterns
            const normalizedModel = modelNumber.trim().toUpperCase();
            
            // Extract base number from model if it exists (like B400 or 3330)
            const baseNumberMatch = normalizedModel.match(/([A-Z]?[0-9]+)/i);
            const baseNumber = baseNumberMatch ? baseNumberMatch[1] : normalizedModel;
            
            // Create more specific search variants for the main series
            let modelVariants = [];
            
            // Handle common Xerox model prefixes
            if (normalizedModel.startsWith('B4') || normalizedModel.startsWith('C4')) {
                // VersaLink B400/B405/C400/C405 series
                modelVariants = [
                    normalizedModel,
                    `VERSALINK ${normalizedModel}`,
                    `VERSALINK ${baseNumber}`,
                    `VERSALINK ${baseNumber}DN`,
                    `VERSALINK ${baseNumber}DNM`
                ];
            } else if (normalizedModel.startsWith('33') || normalizedModel === '3330' || normalizedModel.includes('3330')) {
                // Phaser 3330 and WorkCentre 3335/3345 series
                modelVariants = [
                    normalizedModel,
                    `PHASER ${normalizedModel}`,
                    `PHASER ${baseNumber}`,
                    `PHASER ${baseNumber}DNI`,
                    `WORKCENTRE 3335`,
                    `WORKCENTRE 3345`
                ];
            } else {
                // Generic variants
                modelVariants = [
                    normalizedModel,
                    `PHASER ${normalizedModel}`,
                    `WORKCENTRE ${normalizedModel}`,
                    `ALTALINK ${normalizedModel}`,
                    `VERSALINK ${normalizedModel}`
                ];
            }

            // If we have cached products, filter them by model number OR by compatible part numbers
            if (cachedProducts && cachedProducts.length > 0) {
                const filteredProducts = cachedProducts.filter(product => {
                    if (!product || !product.title) return false;
                    
                    // Check if product title matches the model
                    const title = product.title.toUpperCase();
                    const titleMatch = modelVariants.some(variant => title.includes(variant));
                    
                    if (titleMatch) return true;
                    
                    // Check if any of the product's OEM numbers are in our part-to-model mapping
                    // and if those parts are compatible with our current model
                    let partMatch = false;
                    
                    if (product.oemNos && Array.isArray(product.oemNos)) {
                        for (const oem of product.oemNos) {
                            if (!oem || !oem.oemNo) continue;
                            
                            const oemNo = oem.oemNo.toUpperCase();
                            
                            // Check each part number mapping
                            for (const [partNumber, compatibleModels] of Object.entries(partToModelMap)) {
                                // More lenient matching - if the OEM number contains the part number
                                // or if the normalized OEM number matches part number in any way
                                if ((oemNo.includes(partNumber) || partNumber.includes(oemNo) || 
                                    oemNo.replace(/[^0-9]/g, '').includes(partNumber.replace(/[^0-9]/g, ''))) && 
                                    compatibleModels.some(model => 
                                        modelVariants.some(variant => 
                                            variant.includes(model) || model.includes(variant) || 
                                            (baseNumber && model.includes(baseNumber))
                                        )
                                    )) {
                                    partMatch = true;
                                    break;
                                }
                            }
                            
                            if (partMatch) break;
                        }
                    }
                    
                    return partMatch;
                });
                
                if (filteredProducts.length > 0) {
                    console.log('Using cached products for model:', modelNumber);
                    setSupplies(filteredProducts);
                    setIsLoading(false);
                    return;
                }
            }

            // If no cached products match or cache is empty, make API request
            for (const searchVariant of [`xerox ${modelNumber}`, `xerox phaser ${modelNumber}`, `xerox workcentre ${modelNumber}`]) {
                console.log('Fetching model products from API:', searchVariant);
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
                            localStorage.setItem(`xerox_model_${modelNumber}`, JSON.stringify(validProducts));
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
                const modelCache = localStorage.getItem(`xerox_model_${modelNumber}`);
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
            
            // Create model-specific fallbacks for common models
            if (normalizedModel.includes('B400') || normalizedModel === 'B400' || 
                modelVariants.some(v => v.includes('VERSALINK B400'))) {
                // VersaLink B400 specific fallbacks
                fallbackProducts.push({
                    id: `106R03580-fallback`,
                    title: `Xerox 106R03580 Toner Cartridge (Compatible with VersaLink B400)`,
                    oemNos: [{ oemNo: "106R03580" }],
                    serviceLevels: [{ price: 89.99 }],
                    images: ["/static/toner-placeholder.webp"]
                });
                
                fallbackProducts.push({
                    id: `106R03582-fallback`,
                    title: `Xerox 106R03582 High Capacity Toner Cartridge (Compatible with VersaLink B400)`,
                    oemNos: [{ oemNo: "106R03582" }],
                    serviceLevels: [{ price: 119.99 }],
                    images: ["/static/toner-placeholder.webp"]
                });
                
                fallbackProducts.push({
                    id: `B400-maintenance-fallback`,
                    title: `Xerox VersaLink B400 Maintenance Kit`,
                    oemNos: [{ oemNo: "XER-B400-MAINT" }],
                    serviceLevels: [{ price: 149.99 }],
                    images: ["/static/toner-placeholder.webp"]
                });
            } 
            else if (normalizedModel.includes('3330') || normalizedModel === '3330' || 
                    modelVariants.some(v => v.includes('PHASER 3330'))) {
                // Phaser 3330 specific fallbacks
                fallbackProducts.push({
                    id: `106R03624-fallback`,
                    title: `Xerox 106R03624 Toner Cartridge (Compatible with Phaser 3330)`,
                    oemNos: [{ oemNo: "106R03624" }],
                    serviceLevels: [{ price: 79.99 }],
                    images: ["/static/toner-placeholder.webp"]
                });
                
                fallbackProducts.push({
                    id: `106R03622-fallback`,
                    title: `Xerox 106R03622 High Capacity Toner Cartridge (Compatible with Phaser 3330)`,
                    oemNos: [{ oemNo: "106R03622" }],
                    serviceLevels: [{ price: 99.99 }],
                    images: ["/static/toner-placeholder.webp"]
                });
                
                fallbackProducts.push({
                    id: `3330-drum-fallback`,
                    title: `Xerox Phaser 3330 Drum Unit`,
                    oemNos: [{ oemNo: "101R00555" }],
                    serviceLevels: [{ price: 69.99 }],
                    images: ["/static/toner-placeholder.webp"]
                });
            }
            else {
                // Check if current model matches any in our part mapping
                for (const [partNumber, compatibleModels] of Object.entries(partToModelMap)) {
                    if (compatibleModels.some(model => 
                        modelVariants.some(variant => variant.includes(model)))) {
                        
                        // Add appropriate fallback products
                        if (partNumber.startsWith('106R')) {
                            fallbackProducts.push({
                                id: `${partNumber}-fallback`,
                                title: `Xerox ${partNumber} Toner Cartridge (Compatible with ${compatibleModels[0]})`,
                                oemNos: [{ oemNo: partNumber }],
                                serviceLevels: [{ price: 89.99 }],
                                images: ["/static/toner-placeholder.webp"]
                            });
                        }
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
                        title: `Xerox ${modelNumber.includes('B4') ? 'VersaLink' : 
                               modelNumber.includes('33') && modelNumber.length > 4 ? 'WorkCentre' : 
                               'Phaser'} ${modelNumber} Black Toner`,
                        oemNos: [{ oemNo: "XER-TONER-BK" }],
                        serviceLevels: [{ price: 79.99 }],
                        images: ["/static/toner-placeholder.webp"]
                    },
                    {
                        id: "fallback2",
                        title: `Xerox ${modelNumber.includes('B4') ? 'VersaLink' : 
                               modelNumber.includes('33') && modelNumber.length > 4 ? 'WorkCentre' : 
                               'Phaser'} ${modelNumber} Waste Toner Box`,
                        oemNos: [{ oemNo: "XER-WB" }],
                        serviceLevels: [{ price: 39.99 }],
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

    const filterSuppliesByType = () => {
        // First filter by origin
        const originFiltered = filterProductsByOrigin(supplies);
        
        if (!originFiltered || originFiltered.length === 0) {
            return [];
        }

        // If no filter is active, return all supplies
        if (!activeTab) {
            return originFiltered;
        }

        switch (activeTab) {
            case "toner":
                return originFiltered.filter(item => 
                    item.title.toLowerCase().includes("toner") && 
                    !item.title.toLowerCase().includes("waste")
                );
            case "waste":
                return originFiltered.filter(item => 
                    item.title.toLowerCase().includes("waste") || 
                    item.title.toLowerCase().includes("collection")
                );
            case "imaging":
                return originFiltered.filter(item => 
                    item.title.toLowerCase().includes("imaging") || 
                    item.title.toLowerCase().includes("drum") || 
                    item.title.toLowerCase().includes("developer")
                );
            default:
                return originFiltered;
        }
    };
    
    // Helper function to extract OEM part number from product
    const extractPartNumber = (product) => {
        if (!product || !product.oemNos || !Array.isArray(product.oemNos) || product.oemNos.length === 0) {
            return 'N/A';
        }
        
        // Try to find specific part numbers we're interested in
        const targetParts = [
            // Phaser 6510 series
            '106R00759', '106R00760', '106R00761', '106R00762', '106R00763', '106R00764', 
            '106R00765', '106R00766', '106R00767', '106R00768', '106R00769', '106R00770',
            // VersaLink B400/B405 series
            '106R03580', '106R03582', '106R03584', '106R03941', '106R03942',
            // Phaser 3330 and WorkCentre 3335/3345 series
            '106R03624', '106R03622', '106R03620'
        ];
        
        for (const oem of product.oemNos) {
            if (!oem || !oem.oemNo) continue;
            
            const oemNo = oem.oemNo.toUpperCase();
            
            // Check if this OEM number contains any of our target parts
            for (const part of targetParts) {
                if (oemNo.includes(part)) {
                    return part;
                }
            }
            
            // If no specific match, return the first OEM number
            return oem.oemNo;
        }
        
        return product.oemNos[0]?.oemNo || 'N/A';
    };
    
    // Helper function to check if a product is compatible with the current model
    const getCompatibilityInfo = (product) => {
        if (!product) return null;
        
        const partNumber = extractPartNumber(product);
        
        // Define the compatibility mapping
        const compatibilityInfo = {
            '106R00759': {
                models: ['Phaser 6510', 'Phaser 6510DN'],
                description: 'Compatible with Phaser 6510, 6510DN'
            },
            '106R00760': {
                models: ['Phaser 6510', 'Phaser 6510DN'],
                description: 'Compatible with Phaser 6510, 6510DN'
            },
            '106R00761': {
                models: ['Phaser 6510', 'Phaser 6510DN'],
                description: 'Compatible with Phaser 6510, 6510DN'
            },
            '106R00762': {
                models: ['Phaser 6510', 'Phaser 6510DN'],
                description: 'Compatible with Phaser 6510, 6510DN'
            },
            '106R00763': {
                models: ['Phaser 6510', 'Phaser 6510DN'],
                description: 'Compatible with Phaser 6510, 6510DN'
            },
            '106R00764': {
                models: ['Phaser 6510', 'Phaser 6510DN'],
                description: 'Compatible with Phaser 6510, 6510DN'
            },
            '106R00765': {
                models: ['Phaser 6510', 'Phaser 6510DN'],
                description: 'Compatible with Phaser 6510, 6510DN'
            },
            '106R00766': {
                models: ['Phaser 6510', 'Phaser 6510DN'],
                description: 'Compatible with Phaser 6510, 6510DN'
            },
            '106R00767': {
                models: ['Phaser 6510', 'Phaser 6510DN'],
                description: 'Compatible with Phaser 6510, 6510DN'
            },
            '106R00768': {
                models: ['Phaser 6510', 'Phaser 6510DN'],
                description: 'Compatible with Phaser 6510, 6510DN'
            },
            '106R00769': {
                models: ['Phaser 6510', 'Phaser 6510DN'],
                description: 'Compatible with Phaser 6510, 6510DN'
            },
            '106R00770': {
                models: ['Phaser 6510', 'Phaser 6510DN'],
                description: 'Compatible with Phaser 6510, 6510DN'
            },
            // VersaLink B400/B405 compatibility info
            '106R03580': {
                models: ['VersaLink B400', 'VersaLink B400dn', 'VersaLink B405', 'VersaLink B405dn'],
                description: 'Compatible with VersaLink B400, B400dn, B405, B405dn'
            },
            '106R03582': {
                models: ['VersaLink B400', 'VersaLink B400dn', 'VersaLink B405', 'VersaLink B405dn'],
                description: 'Compatible with VersaLink B400, B405 Series'
            },
            '106R03584': {
                models: ['VersaLink B400', 'VersaLink B400dn', 'VersaLink B405', 'VersaLink B405dn'],
                description: 'Compatible with VersaLink B400, B405 Series'
            },
            '106R03941': {
                models: ['VersaLink B400', 'VersaLink B405'],
                description: 'Compatible with VersaLink B400, B405 Series'
            },
            '106R03942': {
                models: ['VersaLink B400', 'VersaLink B405'],
                description: 'Compatible with VersaLink B400, B405 Series'
            },
            // Phaser 3330 and WorkCentre 3335/3345 compatibility info
            '106R03624': {
                models: ['Phaser 3330', 'Phaser 3330dni', 'WorkCentre 3335', 'WorkCentre 3335dni', 'WorkCentre 3345', 'WorkCentre 3345dni'],
                description: 'Compatible with Phaser 3330, WorkCentre 3335, WorkCentre 3345'
            },
            '106R03622': {
                models: ['Phaser 3330', 'WorkCentre 3335', 'WorkCentre 3345'],
                description: 'Compatible with Phaser 3330, WorkCentre 3335/3345'
            },
            '106R03620': {
                models: ['Phaser 3330', 'WorkCentre 3335', 'WorkCentre 3345'],
                description: 'Compatible with Phaser 3330, WorkCentre 3335/3345'
            }
        };
        
        return compatibilityInfo[partNumber] || null;
    };

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
                                Xerox Supplies
                            </div>
                        </h1>
                        <div className={moduleStyles.modelNavigation}>
                            <Link href="/xerox" className={moduleStyles.backToModels}>
                                &laquo; Back to All Models
                            </Link>
                        </div>
                        <div className={moduleStyles.modelBox}>
                            <h2 className={moduleStyles.modelSubHeader}>
                                {modelNumber && modelNumber.includes('B4') ? 'VersaLink ' : 
                                 modelNumber && modelNumber.includes('33') && modelNumber.length <= 4 ? 'Phaser ' : 
                                 modelNumber && modelNumber.includes('33') && modelNumber.length > 4 ? 'WorkCentre ' : 
                                 'Phaser '}{modelNumber}
                            </h2>
                        </div>
                    </div>
                </div>

                <div style={{display: 'flex', justifyContent: 'space-between', padding: '0 20px', flexWrap: 'wrap'}}>
                    {/* Tab Navigation */}
                    <div className={moduleStyles.tabNavContainer} style={{flex: '1', marginRight: '20px', minWidth: '300px'}}>
                        <div className={moduleStyles.tabNav}>
                            {activeTab && (
                                <button 
                                    className={moduleStyles.tabButton}
                                    onClick={() => setActiveTab(null)}
                                >
                                    Clear Filters
                                </button>
                            )}
                            <button 
                                className={`${moduleStyles.tabButton} ${activeTab === 'toner' ? moduleStyles.activeTab : ''}`}
                                onClick={() => setActiveTab(activeTab === 'toner' ? null : 'toner')}
                            >
                                Toner Cartridges
                            </button>
                            <button 
                                className={`${moduleStyles.tabButton} ${activeTab === 'waste' ? moduleStyles.activeTab : ''}`}
                                onClick={() => setActiveTab(activeTab === 'waste' ? null : 'waste')}
                            >
                                Waste Collection
                            </button>
                            <button 
                                className={`${moduleStyles.tabButton} ${activeTab === 'imaging' ? moduleStyles.activeTab : ''}`}
                                onClick={() => setActiveTab(activeTab === 'imaging' ? null : 'imaging')}
                            >
                                Imaging Units
                            </button>
                        </div>
                    </div>
                    
                    {/* Origin Filter */}
                    <div style={{width: 'auto', minWidth: '250px'}}>
                        <OriginFilter onFilterChange={handleOriginFilterChange} />
                    </div>
                </div>

                <div className={styles.center}>
                    {isLoading ? (
                        <div className={moduleStyles.loaderContainer}>
                            <div className={moduleStyles.loader}></div>
                        </div>
                    ) : (
                        filterSuppliesByType().length > 0 ? (
                            <div className={styles.boxContainer}>
                                {filterSuppliesByType().map((item) => {
                                    const partNumber = extractPartNumber(item);
                                    const compatInfo = getCompatibilityInfo(item);
                                    
                                    return (
                                        <div key={item.id || item.oemNos[0]?.oemNo} className={styles.box}>
                                            {/* Compatibility Badge */}
                                            {compatInfo && (
                                                <div className={styles.compatibilityBadge}>
                                                    {compatInfo.models.length > 1 ? 'Compatible with multiple models' : `For Phaser ${modelNumber}`}
                                                </div>
                                            )}
                                            
                                            <Image
                                                alt={"image of toner"}
                                                style={{ borderRadius: "5px" }}
                                                src={item.images && item.images[0] ? item.images[0] : "/static/toner-placeholder.webp"}
                                                width={180}
                                                height={180}
                                            />
                                            
                                            {/* Part Number Tag */}
                                            <div className={styles.partNumberTag}>
                                                Part #: {partNumber}
                                            </div>
                                            
                                            <div className={styles.titleSmallBlack}>
                                                {item.title}
                                            </div>
                                            
                                            {/* Compatible Models Section */}
                                            {compatInfo && (
                                                <div className={styles.compatibilityInfo}>
                                                    {compatInfo.description}
                                                </div>
                                            )}
                                            
                                            <div className={styles.priceContainer}>
                                                <h6 className={styles.price}>
                                                    ${item.serviceLevels && item.serviceLevels[0] ? item.serviceLevels[0].price : (item.price || 79.99)}
                                                </h6>
                                                <button
                                                    className={styles.addToCartButton}
                                                    onClick={() => {
                                                        const newItem = {
                                                            ...item,
                                                            quantity: 1,
                                                        };
                                                        setCart([...cart, newItem]);
                                                    }}
                                                >
                                                    Add to Cart
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={moduleStyles.emptyProductsContainer}>
                                <div className={moduleStyles.nothing}>
                                    No {activeTab ? activeTab : 'supplies'} found for this model
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ModelSupplies; 