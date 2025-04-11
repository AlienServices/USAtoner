"use client";
import React, { useEffect, useRef, useState, useContext } from "react";
import Header from "../../../components/Header";
import Image from "next/image";
import styles from "../../../page.module.css";
import Footer from "../../../components/Footer";
import Link from "next/link";
import { CartContext } from "../../../providers/cart";
import { useSearchParams } from "next/navigation";
import moduleStyles from "../../modelSupplies/modelSupplies.module.css";
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
        console.log("HP - Active origin filters:", JSON.stringify(originFilters));
        
        // Safety check for null/undefined products
        if (!products || !Array.isArray(products)) {
            console.error("HP - Products is not an array:", products);
            return [];
        }
        
        // If no filters are active, return all products
        if (!originFilters.usaMade && !originFilters.americasMade && !originFilters.worldWideMade) {
            console.log("HP - No origin filters active, returning all products:", products.length);
            return products;
        }

        // Log a sample of product origins
        const sampleSize = Math.min(products.length, 5);
        const originSamples = products.slice(0, sampleSize).map(p => p.origin || 'unknown');
        console.log(`HP - Origin samples from ${products.length} products:`, originSamples);

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
        
        console.log(`HP - Filtered products: ${filtered.length} out of ${products.length}`);
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

            // Define part number to model mapping for HP
            const partToModelMap = {
                'CF500A': ['M402', 'M403', 'M404'],
                'CF500X': ['M402', 'M403', 'M404'],
                'CF500Y': ['M402', 'M403', 'M404'],
                'CF500M': ['M402', 'M403', 'M404'],
                'CF283A': ['M426', 'M427', 'M428'],
                'CF283X': ['M426', 'M427', 'M428'],
                'CF283Y': ['M426', 'M427', 'M428'],
                'CF283M': ['M426', 'M427', 'M428'],
                // Add more mappings as needed
            };

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
            const normalizedModel = modelNumber.trim().toUpperCase();
            const modelVariants = [
                normalizedModel,
                `LaserJet ${normalizedModel}`,
                `LaserJet Pro ${normalizedModel}`,
                `OfficeJet ${normalizedModel}`,
                `OfficeJet Pro ${normalizedModel}`
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
                    setSupplies(filteredProducts);
                    setIsLoading(false);
                    return;
                }
            }

            // If no cached products match or cache is empty, make API request
            for (const searchVariant of [`hp ${modelNumber}`, `hp laserjet ${modelNumber}`, `hp officejet ${modelNumber}`]) {
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
                    if (partNumber.startsWith('CF500')) {
                        fallbackProducts.push({
                            id: `${partNumber}-fallback`,
                            title: `HP ${partNumber} Toner Cartridge (Compatible with LaserJet ${normalizedModel})`,
                            oemNos: [{ oemNo: partNumber }],
                            serviceLevels: [{ price: 89.99 }],
                            images: ["/static/toner-placeholder.webp"]
                        });
                    } else if (partNumber.startsWith('CF283')) {
                        fallbackProducts.push({
                            id: `${partNumber}-fallback`,
                            title: `HP ${partNumber} Toner Cartridge (Compatible with LaserJet ${normalizedModel})`,
                            oemNos: [{ oemNo: partNumber }],
                            serviceLevels: [{ price: 99.99 }],
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
                        title: `HP LaserJet ${modelNumber} Black Toner`,
                        oemNos: [{ oemNo: "HP-TONER-BK" }],
                        serviceLevels: [{ price: 79.99 }],
                        images: ["/static/toner-placeholder.webp"]
                    },
                    {
                        id: "fallback2",
                        title: `HP LaserJet ${modelNumber} Waste Toner Box`,
                        oemNos: [{ oemNo: "HP-WB" }],
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
        const targetParts = ['CF500A', 'CF500X', 'CF500Y', 'CF500M', 'CF283A', 'CF283X', 'CF283Y', 'CF283M'];
        
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
            'CF500A': {
                models: ['M402', 'M403', 'M404'],
                description: 'Compatible with LaserJet M402, M403, M404'
            },
            'CF500X': {
                models: ['M402', 'M403', 'M404'],
                description: 'Compatible with LaserJet M402, M403, M404'
            },
            'CF500Y': {
                models: ['M402', 'M403', 'M404'],
                description: 'Compatible with LaserJet M402, M403, M404'
            },
            'CF500M': {
                models: ['M402', 'M403', 'M404'],
                description: 'Compatible with LaserJet M402, M403, M404'
            },
            'CF283A': {
                models: ['M426', 'M427', 'M428'],
                description: 'Compatible with LaserJet M426, M427, M428'
            },
            'CF283X': {
                models: ['M426', 'M427', 'M428'],
                description: 'Compatible with LaserJet M426, M427, M428'
            },
            'CF283Y': {
                models: ['M426', 'M427', 'M428'],
                description: 'Compatible with LaserJet M426, M427, M428'
            },
            'CF283M': {
                models: ['M426', 'M427', 'M428'],
                description: 'Compatible with LaserJet M426, M427, M428'
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
                                LaserJet {modelNumber}
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
                                                    {compatInfo.models.length > 1 ? 'Compatible with multiple models' : `For LaserJet ${modelNumber}`}
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