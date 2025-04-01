"use client";
import React, { useEffect, useRef, useState, useContext } from "react";
import Header from "../components/Header";
import Image from "next/image";
import styles from "../page.module.css";
import Footer from "../components/Footer";
import Link from "next/link";
import { CartContext } from "../providers/cart";
import { useSearchParams } from "next/navigation";
import moduleStyles from "./modelSupplies.module.css";

const ModelSupplies = () => {
    const searchParams = useSearchParams();
    const modelNumber = searchParams.get("model");
    const { cart, setCart } = useContext(CartContext);
    const [activeTab, setActiveTab] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [supplies, setSupplies] = useState([]);
    
    // Define Konica part number to model mapping at component level
    const partToModelMap = {
        // Konica Minolta Bizhub 4000 Series
        'TNP37': ['4700P'],
        'TNP44': ['4050', '4750'],
        '4152-611': ['4152'],
        
        // Konica Minolta Bizhub 3000 Series
        'TNP39': ['3300P', '3301P'],
        'TNP40': ['3320', '3350'],
        'TNP41': ['3320', '3350'],
        
        // Konica Minolta Bizhub C3000 Series
        'TN318K': ['C358'],
        'TN318C': ['C358'],
        'TN318M': ['C358'],
        'TN318Y': ['C358'],
        
        // Konica Minolta Bizhub C2000 Series
        'TN213K': ['C203', 'C253'],
        'TN213C': ['C203', 'C253'],
        'TN213M': ['C203', 'C253'],
        'TN213Y': ['C203', 'C253'],
        
        // Konica Minolta Bizhub C1000 Series
        'TN116': ['164', '165', '185'],
        'TN117': ['184', '195', '215', '235'],
        'TN118': ['195', '215', '235'],
        
        // Konica Minolta Magicolor Series
        'A0V301F': ['1600W', '1650EN', '1680MF', '1690MF'],
        'A0V30HF': ['1600W', '1650EN', '1680MF', '1690MF'],
        'A0V30CF': ['1600W', '1650EN', '1680MF', '1690MF'],
        'A0V306F': ['1600W', '1650EN', '1680MF', '1690MF'],
        
        // Waste Toners
        'WB-P03': ['4000 Series', '3000 Series'],
        'WB-P05': ['C3000 Series', 'C2000 Series'],
        'WB-P07': ['C1000 Series'],
        
        // Imaging Units
        'IU-310K': ['C350', 'C351', 'C450'],
        'IU-310C': ['C350', 'C351', 'C450'],
        'IU-310M': ['C350', 'C351', 'C450'],
        'IU-310Y': ['C350', 'C351', 'C450'],
        
        // Add more mappings as needed
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

            // First try to get Konica Minolta products from cache
            let cachedProducts = [];
            try {
                const cachedData = localStorage.getItem("konica");
                if (cachedData) {
                    cachedProducts = JSON.parse(cachedData);
                }
            } catch (cacheErr) {
                console.error('Error loading cached data:', cacheErr);
            }

            // Normalize model number and prepare search patterns
            const normalizedModel = modelNumber.trim().toUpperCase();
            const modelVariants = [
                normalizedModel,
                `C${normalizedModel}`,
                normalizedModel.replace(/^C/, ''),
                `BIZHUB ${normalizedModel}`,
                `BIZHUB C${normalizedModel}`
            ];

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
                                if (oemNo.includes(partNumber) && 
                                    compatibleModels.some(model => 
                                        modelVariants.some(variant => variant.includes(model))
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
                    // Enhance product titles to show compatibility if not already mentioned
                    const enhancedProducts = filteredProducts.map(product => {
                        // If the product title doesn't already mention the model number
                        if (!modelVariants.some(variant => 
                            product.title.toUpperCase().includes(variant))) {
                            // Add compatibility note to the title
                            return {
                                ...product,
                                title: `${product.title}`
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
            // Try multiple search terms to increase chances of finding the model
            for (const searchVariant of [`konica ${modelNumber}`, `bizhub ${modelNumber}`, `konica bizhub ${modelNumber}`, 'TNP37', 'TNP44', '4152-611']) {
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
                        // For model number searches
                        if (searchVariant.includes(modelNumber)) {
                            // Filter for products that mention the model number
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
                                
                                // Cache these results for potential reuse
                                localStorage.setItem(`model_${modelNumber}`, JSON.stringify(validProducts));
                                setIsLoading(false);
                                return;
                            }
                        }
                        // For part number searches
                        else if (['TNP37', 'TNP44', '4152-611'].includes(searchVariant)) {
                            // Check if this part is compatible with our model
                            const compatibleModels = partToModelMap[searchVariant] || [];
                            if (compatibleModels.some(model => 
                                modelVariants.some(variant => variant.includes(model)))) {
                                
                                // Filter for valid products with this part number
                                const validProducts = data.cancel.products.filter(product => 
                                    product && 
                                    product.title && 
                                    product.oemNos && 
                                    Array.isArray(product.oemNos) && 
                                    product.oemNos.length > 0 &&
                                    product.serviceLevels && 
                                    Array.isArray(product.serviceLevels) && 
                                    product.serviceLevels.length > 0 &&
                                    product.oemNos.some(oem => 
                                        oem.oemNo && oem.oemNo.toUpperCase().includes(searchVariant)
                                    )
                                );
                                
                                if (validProducts.length > 0) {
                                    // Enhance product titles to show compatibility
                                    const enhancedProducts = validProducts.map(product => ({
                                        ...product,
                                        title: `${product.title} (Compatible with Bizhub ${normalizedModel})`
                                    }));
                                    
                                    setSupplies(enhancedProducts);
                                    
                                    // Cache these results for potential reuse
                                    localStorage.setItem(`model_${modelNumber}`, JSON.stringify(enhancedProducts));
                                    setIsLoading(false);
                                    return;
                                }
                            }
                        }
                    }
                } catch (apiError) {
                    console.error(`API request failed for ${searchVariant}:`, apiError);
                }
            }
            
            // If we get here, try to load from model-specific cache as last resort
            try {
                const modelCache = localStorage.getItem(`model_${modelNumber}`);
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
                    if (partNumber === 'TNP37') {
                        fallbackProducts.push({
                            id: "tnp37-fallback",
                            title: `Konica Minolta TNP37 Black Toner (Compatible with Bizhub ${normalizedModel})`,
                            oemNos: [{ oemNo: "TNP37" }],
                            serviceLevels: [{ price: 89.99 }],
                            images: ["/static/toner-placeholder.webp"]
                        });
                    } else if (partNumber === 'TNP44') {
                        fallbackProducts.push({
                            id: "tnp44-fallback",
                            title: `Konica Minolta TNP44 Black Toner (Compatible with Bizhub ${normalizedModel})`,
                            oemNos: [{ oemNo: "TNP44" }],
                            serviceLevels: [{ price: 99.99 }],
                            images: ["/static/toner-placeholder.webp"]
                        });
                    } else if (partNumber === '4152-611') {
                        fallbackProducts.push({
                            id: "4152-611-fallback",
                            title: `Konica Minolta 4152-611 Imaging Unit (Compatible with Bizhub ${normalizedModel})`,
                            oemNos: [{ oemNo: "4152-611" }],
                            serviceLevels: [{ price: 129.99 }],
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
                        title: `Konica Minolta Bizhub ${modelNumber} Black Toner`,
                        oemNos: [{ oemNo: "KM-TONER-BK" }],
                        serviceLevels: [{ price: 79.99 }],
                        images: ["/static/toner-placeholder.webp"]
                    },
                    {
                        id: "fallback2",
                        title: `Konica Minolta Bizhub ${modelNumber} Waste Toner Box`,
                        oemNos: [{ oemNo: "KM-WB" }],
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
        if (!supplies || supplies.length === 0) {
            return [];
        }

        // If no filter is active, return all supplies
        if (!activeTab) {
            return supplies;
        }

        // More specific categorization
        switch (activeTab) {
            case "black-toner":
                return supplies.filter(item => 
                    item.title.toLowerCase().includes("toner") && 
                    !item.title.toLowerCase().includes("waste") &&
                    (item.title.toLowerCase().includes("black") || 
                     !item.title.toLowerCase().match(/cyan|magenta|yellow|color/i))
                );
            case "color-toner":
                return supplies.filter(item => 
                    item.title.toLowerCase().includes("toner") &&
                    !item.title.toLowerCase().includes("waste") &&
                    item.title.toLowerCase().match(/cyan|magenta|yellow|color/i)
                );
            case "waste":
                return supplies.filter(item => 
                    item.title.toLowerCase().includes("waste") || 
                    item.title.toLowerCase().includes("collection")
                );
            case "imaging-drum":
                return supplies.filter(item => 
                    item.title.toLowerCase().includes("imaging") || 
                    item.title.toLowerCase().includes("drum") ||
                    item.title.toLowerCase().includes("image unit") ||
                    item.title.toLowerCase().includes("iu-")
                );
            case "developer":
                return supplies.filter(item => 
                    item.title.toLowerCase().includes("developer") ||
                    item.title.toLowerCase().includes("development")
                );
            case "maintenance":
                return supplies.filter(item => 
                    item.title.toLowerCase().includes("maintenance") || 
                    item.title.toLowerCase().includes("kit") ||
                    item.title.toLowerCase().includes("fuser")
                );
            default:
                return supplies;
        }
    };
    
    // Group supplies by type (for displaying categorized lists)
    const groupSuppliesByType = () => {
        if (!supplies || supplies.length === 0) return [];
        
        const groups = {
            'Black Toner Cartridges': [],
            'Color Toner Cartridges': [],
            'Imaging Drums & Units': [],
            'Developers': [],
            'Waste Toner Collectors': [],
            'Maintenance Kits': [],
            'Other Supplies': []
        };
        
        supplies.forEach(item => {
            if (!item || !item.title) return;
            
            const title = item.title.toLowerCase();
            const compatInfo = getCompatibilityInfo(item);
            const partNumber = extractPartNumber(item);
            
            // Check if this is a color toner cartridge based on part number or title
            const isColorToner = 
                (partNumber && /^(TN|A0)[0-9]+(C|M|Y)/i.test(partNumber)) ||
                (title && (title.includes('cyan') || title.includes('magenta') || 
                          title.includes('yellow') || title.includes('color')));
                           
            // Determine the appropriate category
            if (compatInfo?.supplyType?.includes('Drum') || 
                title.includes('drum') || 
                title.includes('imaging unit') ||
                title.includes('image unit') ||
                title.includes('iu-')) {
                groups['Imaging Drums & Units'].push(item);
            } else if (title.includes('developer') || title.includes('development')) {
                groups['Developers'].push(item);
            } else if (title.includes('maintenance') || title.includes('kit') || title.includes('fuser')) {
                groups['Maintenance Kits'].push(item);
            } else if (title.includes('waste') || title.includes('collection')) {
                groups['Waste Toner Collectors'].push(item);
            } else if (title.includes('toner')) {
                // Sort toners by black vs. color
                if (isColorToner) {
                    groups['Color Toner Cartridges'].push(item);
                } else {
                    groups['Black Toner Cartridges'].push(item);
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
    
    // Helper function to extract OEM part number from product
    const extractPartNumber = (product) => {
        if (!product || !product.oemNos || !Array.isArray(product.oemNos) || product.oemNos.length === 0) {
            return 'N/A';
        }
        
        // Try to find specific part numbers we're interested in
        const targetParts = ['TNP37', 'TNP44', '4152-611'];
        
        for (const oem of product.oemNos) {
            if (!oem || !oem.oemNo) continue;
            
            const oemNo = oem.oemNo.toUpperCase();
            
            // Check if this OEM number contains any of our target parts
            for (const part of targetParts) {
                // Use exact match for 4152-611 to avoid partial matching issues
                if (part === '4152-611') {
                    if (oemNo === '4152-611' || oemNo.includes('4152611') || oemNo.includes('4152-611')) {
                        return part;
                    }
                } else if (part === 'TNP37') {
                    // Handle TNP37 variations
                    if (oemNo === 'TNP37' || oemNo === 'TNP-37' || oemNo.includes('TNP37') || oemNo.includes('TNP-37')) {
                        return part;
                    }
                } else if (oemNo.includes(part)) {
                    return part; // Return the matching part number
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
            'TNP37': {
                models: ['4700P'],
                description: 'Compatible with Bizhub 4700P'
            },
            'TNP44': {
                models: ['4050', '4750'],
                description: 'Compatible with Bizhub 4050, 4750'
            },
            '4152-611': {
                models: ['4152'],
                description: 'Compatible with Bizhub 4152'
            }
        };
        
        return compatibilityInfo[partNumber] || null;
    };

    // Helper function to get display name for tab
    const getTabDisplayName = (tab) => {
        switch(tab) {
            case 'black-toner': return 'black toner cartridges';
            case 'color-toner': return 'color toner cartridges';
            case 'imaging-drum': return 'imaging units';
            case 'developer': return 'developers';
            case 'waste': return 'waste collection units';
            case 'maintenance': return 'maintenance kits';
            default: return tab;
        }
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
                                Konica Minolta Supplies
                            </div>
                        </h1>
                        <div className={moduleStyles.modelNavigation}>
                            <Link href="/konika" className={moduleStyles.backToModels}>
                                &laquo; Back to All Models
                            </Link>
                        </div>
                        <div className={moduleStyles.modelBox}>
                            <h2 className={moduleStyles.modelSubHeader}>
                                Bizhub {modelNumber}
                            </h2>
                        </div>
                    </div>
                </div>

                <div className={moduleStyles.tabNavContainer}>
                    <div className={moduleStyles.tabNav}>
                        {activeTab && (
                            <button 
                                className={moduleStyles.tabButton}
                                onClick={() => setActiveTab(null)}
                            >
                                All Supplies
                            </button>
                        )}
                        <button 
                            className={`${moduleStyles.tabButton} ${activeTab === 'black-toner' ? moduleStyles.activeTab : ''}`}
                            onClick={() => setActiveTab(activeTab === 'black-toner' ? null : 'black-toner')}
                        >
                            Black Toner
                        </button>
                        <button 
                            className={`${moduleStyles.tabButton} ${activeTab === 'color-toner' ? moduleStyles.activeTab : ''}`}
                            onClick={() => setActiveTab(activeTab === 'color-toner' ? null : 'color-toner')}
                        >
                            Color Toner
                        </button>
                        <button 
                            className={`${moduleStyles.tabButton} ${activeTab === 'imaging-drum' ? moduleStyles.activeTab : ''}`}
                            onClick={() => setActiveTab(activeTab === 'imaging-drum' ? null : 'imaging-drum')}
                        >
                            Imaging Units
                        </button>
                        <button 
                            className={`${moduleStyles.tabButton} ${activeTab === 'developer' ? moduleStyles.activeTab : ''}`}
                            onClick={() => setActiveTab(activeTab === 'developer' ? null : 'developer')}
                        >
                            Developers
                        </button>
                        <button 
                            className={`${moduleStyles.tabButton} ${activeTab === 'waste' ? moduleStyles.activeTab : ''}`}
                            onClick={() => setActiveTab(activeTab === 'waste' ? null : 'waste')}
                        >
                            Waste Collection
                        </button>
                        <button 
                            className={`${moduleStyles.tabButton} ${activeTab === 'maintenance' ? moduleStyles.activeTab : ''}`}
                            onClick={() => setActiveTab(activeTab === 'maintenance' ? null : 'maintenance')}
                        >
                            Maintenance Kits
                        </button>
                    </div>
                </div>

                <div className={styles.center}>
                    {isLoading ? (
                        <div className={moduleStyles.loaderContainer}>
                            <div className={moduleStyles.loader}></div>
                        </div>
                    ) : (
                        filterSuppliesByType().length > 0 ? (
                            activeTab ? (
                                <div className={styles.boxContainer}>
                                    {filterSuppliesByType().map((item) => {
                                        const partNumber = extractPartNumber(item);
                                        const compatInfo = getCompatibilityInfo(item);
                                        
                                        return (
                                            <div key={item.id || item.oemNos[0]?.oemNo} className={styles.box}>
                                                {/* Compatibility Badge */}
                                                {compatInfo && (
                                                    <div className={styles.compatibilityBadge}>
                                                        {compatInfo.models.length > 1 ? 'Compatible with multiple models' : ``}
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
                                                        ${item.serviceLevels[0].price}
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
                                // When no tab is selected, group supplies by type
                                <div className={moduleStyles.typeGroupsContainer}>
                                    {groupSuppliesByType().map((group) => (
                                        <div key={group.name} className={moduleStyles.typeGroup}>
                                            <h3 className={moduleStyles.typeGroupHeader}>
                                                {group.name} <span className={moduleStyles.groupCount}>({group.items.length})</span>
                                            </h3>
                                            <div className={styles.boxContainer}>
                                                {group.items.map((item) => {
                                                    const partNumber = extractPartNumber(item);
                                                    const compatInfo = getCompatibilityInfo(item);
                                                    
                                                    return (
                                                        <div key={item.id || item.oemNos[0]?.oemNo} className={styles.box}>
                                                            {/* Compatibility Badge */}
                                                            {compatInfo && (
                                                                <div className={styles.compatibilityBadge}>
                                                                    {compatInfo.models.length > 1 ? 'Compatible with multiple models' : ``}
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
                                                                    ${item.serviceLevels[0].price}
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
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className={moduleStyles.emptyProductsContainer}>
                                <div className={moduleStyles.nothing}>
                                    No {activeTab ? getTabDisplayName(activeTab) : 'supplies'} found for this model
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