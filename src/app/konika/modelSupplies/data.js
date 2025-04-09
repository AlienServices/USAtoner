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
    
    // Define Konica Minolta part number to model mapping
    const partToModelMap = {
        // Bizhub Series
        'TN-414': ['Bizhub 363', 'Bizhub 423'],
        'TN-415': ['Bizhub 36', 'Bizhub 42'],
        'TN-513': ['Bizhub 454e', 'Bizhub 554e'],
        'TN-514': ['Bizhub 454e', 'Bizhub 554e'],
        'TN-616K': ['Bizhub C6000', 'Bizhub C7000'], // Black
        'TN-616C': ['Bizhub C6000', 'Bizhub C7000'], // Cyan
        'TN-616M': ['Bizhub C6000', 'Bizhub C7000'], // Magenta
        'TN-616Y': ['Bizhub C6000', 'Bizhub C7000'], // Yellow
        'TN-319K': ['Bizhub C360', 'Bizhub C280', 'Bizhub C220'], // Black
        'TN-319C': ['Bizhub C360', 'Bizhub C280', 'Bizhub C220'], // Cyan
        'TN-319M': ['Bizhub C360', 'Bizhub C280', 'Bizhub C220'], // Magenta
        'TN-319Y': ['Bizhub C360', 'Bizhub C280', 'Bizhub C220'], // Yellow
        
        // Magicolor Series
        'A0DK132': ['Magicolor 4650', 'Magicolor 4690', 'Magicolor 4695'], // Black
        'A0DK232': ['Magicolor 4650', 'Magicolor 4690', 'Magicolor 4695'], // Cyan
        'A0DK332': ['Magicolor 4650', 'Magicolor 4690', 'Magicolor 4695'], // Magenta
        'A0DK432': ['Magicolor 4650', 'Magicolor 4690', 'Magicolor 4695'], // Yellow
        'A0V301F': ['Magicolor 1600', 'Magicolor 1650', 'Magicolor 1680', 'Magicolor 1690'], // Black
        'A0V30HF': ['Magicolor 1600', 'Magicolor 1650', 'Magicolor 1680', 'Magicolor 1690'], // Cyan
        'A0V30CF': ['Magicolor 1600', 'Magicolor 1650', 'Magicolor 1680', 'Magicolor 1690'], // Magenta
        'A0V306F': ['Magicolor 1600', 'Magicolor 1650', 'Magicolor 1680', 'Magicolor 1690'], // Yellow
        
        // PagePro Series
        '1710567-001': ['PagePro 1300', 'PagePro 1350', 'PagePro 1380', 'PagePro 1390'],
        '1710511-001': ['PagePro 1200', 'PagePro 1250'],
        '1710517-001': ['PagePro 6', 'PagePro 1100'],
        
        // Drum Units
        'IU-310K': ['Bizhub C350', 'Bizhub C351', 'Bizhub C450'], // Black
        'IU-310C': ['Bizhub C350', 'Bizhub C351', 'Bizhub C450'], // Cyan
        'IU-310M': ['Bizhub C350', 'Bizhub C351', 'Bizhub C450'], // Magenta
        'IU-310Y': ['Bizhub C350', 'Bizhub C351', 'Bizhub C450']  // Yellow
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
                const cachedData = localStorage.getItem("konika");
                if (cachedData) {
                    cachedProducts = JSON.parse(cachedData);
                }
            } catch (cacheErr) {
                console.error('Error loading cached data:', cacheErr);
            }

            // Normalize model number
            const normalizedModel = modelNumber.trim().toUpperCase()
                .replace(/^KONICA\s+/i, '')
                .replace(/^MINOLTA\s+/i, '')
                .replace(/^KONICA\s+MINOLTA\s+/i, '');
            
            // Create various patterns to match the model with different prefixes/formats
            const modelVariants = [
                normalizedModel,
                `KONICA ${normalizedModel}`,
                `MINOLTA ${normalizedModel}`,
                `KONICA MINOLTA ${normalizedModel}`,
                `BIZHUB ${normalizedModel.replace(/^BIZHUB\s*/, '')}`,
                `MAGICOLOR ${normalizedModel.replace(/^MAGICOLOR\s*/, '')}`,
                `PAGEPRO ${normalizedModel.replace(/^PAGEPRO\s*/, '')}`
            ];
            
            // Extract the base model number (remove letters and suffixes)
            const baseModelMatch = normalizedModel.match(/([0-9]+)/);
            const baseModel = baseModelMatch ? baseModelMatch[0] : normalizedModel;
            
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
                                               normalizedModel.includes(modelUpper) ||
                                               modelUpper.includes(normalizedModel) ||
                                               (baseModel && modelUpper.includes(baseModel));
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
                
                // Combine direct model matches and part-compatible products
                const allCompatibleProducts = [...directModelMatches, ...partCompatibleProducts];
                
                if (allCompatibleProducts.length > 0) {
                    const groupedSupplies = groupSuppliesByType(allCompatibleProducts);
                    setSupplies(groupedSupplies);
                    setActiveTab(Object.keys(groupedSupplies)[0] || null);
                    setIsLoading(false);
                    return;
                }
            }
            
            // If no products found in cache or no matches, try both APIs
            let regularProducts = [];
            let dmProducts = [];
            
            // Try regular API first
            try {
                const regularResponse = await fetch('/api/products', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        token: accessToken,
                        search: `konica minolta ${modelNumber}`
                    })
                });
                
                if (regularResponse.ok) {
                    const data = await regularResponse.json();
                    
                    // Extract products based on response format
                    if (data.cancel && Array.isArray(data.cancel.products)) {
                        regularProducts = data.cancel.products;
                    } else if (data.products && Array.isArray(data.products)) {
                        regularProducts = data.products;
                    } else if (Array.isArray(data)) {
                        regularProducts = data;
                    }
                    
                    // Tag products with source information
                    regularProducts = regularProducts.map(product => ({
                        ...product,
                        inventorySource: 'primary',
                        inventoryName: 'Primary Inventory'
                    }));
                }
            } catch (regularError) {
                console.error('Error fetching from regular API:', regularError);
            }
            
            // Try DM API
            try {
                const dmResponse = await fetch('/api/dm-brand-products', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        brand: "konica",
                        model: modelNumber
                    })
                });
                
                if (dmResponse.ok) {
                    const dmData = await dmResponse.json();
                    
                    if (dmData && dmData.success && dmData.data && Array.isArray(dmData.data.products)) {
                        // Tag DM products
                        dmProducts = dmData.data.products.map(product => ({
                            ...product,
                            inventorySource: 'distributorMarketplace',
                            inventoryName: 'Distributor Marketplace'
                        }));
                    }
                }
            } catch (dmError) {
                console.error('Error fetching from DM API:', dmError);
            }
            
            // Combine and deduplicate products
            const allProducts = [...regularProducts, ...dmProducts];
            
            if (allProducts.length > 0) {
                // Filter products by model compatibility
                const compatibleProducts = allProducts.filter(product => {
                    if (!product || !product.title) return false;
                    
                    // Check direct model matches
                    const title = product.title.toUpperCase();
                    if (modelVariants.some(variant => title.includes(variant))) {
                        return true;
                    }
                    
                    // Check part number compatibility
                    if (product.oemNos && Array.isArray(product.oemNos)) {
                        for (const oem of product.oemNos) {
                            if (!oem || !oem.oemNo) continue;
                            
                            const oemNo = oem.oemNo.toUpperCase();
                            for (const [partNumber, compatibleModels] of Object.entries(partToModelMap)) {
                                if ((oemNo === partNumber.toUpperCase() || oemNo.includes(partNumber.toUpperCase())) && 
                                    compatibleModels.some(model => {
                                        const modelUpper = model.toUpperCase();
                                        return normalizedModel === modelUpper || 
                                               normalizedModel.includes(modelUpper) ||
                                               modelUpper.includes(normalizedModel) ||
                                               (baseModel && modelUpper.includes(baseModel));
                                    })) {
                                    return true;
                                }
                            }
                        }
                    }
                    
                    return false;
                });
                
                if (compatibleProducts.length > 0) {
                    const groupedSupplies = groupSuppliesByType(compatibleProducts);
                    setSupplies(groupedSupplies);
                    setActiveTab(Object.keys(groupedSupplies)[0] || null);
                    
                    // Update cache with new products
                    try {
                        localStorage.setItem("konika", JSON.stringify(compatibleProducts));
                    } catch (cacheError) {
                        console.error('Error updating cache:', cacheError);
                    }
                } else {
                    setSupplies({});
                }
            } else {
                setSupplies({});
            }
        } catch (err) {
            console.error('Error fetching model supplies:', err);
            setSupplies({});
        } finally {
            setIsLoading(false);
        }
    }

    // Helper function to categorize Konica Minolta models
    const getCategoryFromModel = (modelNumber) => {
        if (!modelNumber) return "Other";
        
        const model = modelNumber.toUpperCase();
        
        if (model.includes('BIZHUB')) return "Bizhub";
        if (model.includes('MAGICOLOR')) return "Magicolor";
        if (model.includes('PAGEPRO')) return "PagePro";
        
        return "Other";
    };

    // Group supplies by their type (toner, drum, etc.)
    const groupSuppliesByType = (products) => {
        if (!products || !Array.isArray(products) || products.length === 0) {
            return {};
        }
        
        const groupedSupplies = {};
        
        products.forEach(product => {
            if (!product || !product.title) return;
            
            const title = product.title.toUpperCase();
            
            // Determine supply type
            let supplyType = "Other Supplies";
            
            if (title.includes('TONER')) {
                if (title.includes('BLACK')) {
                    supplyType = "Black Toner";
                } else if (title.includes('CYAN')) {
                    supplyType = "Cyan Toner";
                } else if (title.includes('MAGENTA')) {
                    supplyType = "Magenta Toner";
                } else if (title.includes('YELLOW')) {
                    supplyType = "Yellow Toner";
                } else {
                    supplyType = "Toner";
                }
            } else if (title.includes('DRUM') || title.includes('IMAGING')) {
                supplyType = "Imaging Units";
            } else if (title.includes('MAINTENANCE') || title.includes('FUSER')) {
                supplyType = "Maintenance Kits";
            } else if (title.includes('WASTE')) {
                supplyType = "Waste Containers";
            } else if (title.includes('DEVELOPER')) {
                supplyType = "Developer Units";
            }
            
            // Add to the appropriate group
            if (!groupedSupplies[supplyType]) {
                groupedSupplies[supplyType] = [];
            }
            
            groupedSupplies[supplyType].push(product);
        });
        
        return groupedSupplies;
    };

    function extractPartNumber(product) {
        if (!product) return '';
        
        // Try to get from OEM numbers
        if (product.oemNos && Array.isArray(product.oemNos) && product.oemNos.length > 0) {
            for (const oem of product.oemNos) {
                if (oem && oem.oemNo) {
                    return oem.oemNo;
                }
            }
        }
        
        // Try to extract from title
        if (product.title) {
            // Common Konica Minolta part number patterns
            const patterns = [
                /\bTN-([0-9]+[A-Z]?)\b/i,  // e.g., TN-414
                /\bIU-([0-9]+[A-Z]?)\b/i,  // e.g., IU-310K
                /\b(A0[A-Z0-9]{5})\b/i,    // e.g., A0DK132
                /\b([0-9]{7}-[0-9]{3})\b/i // e.g., 1710567-001
            ];
            
            for (const pattern of patterns) {
                const match = product.title.match(pattern);
                if (match && match[1]) {
                    return match[0]; // Return the full match to include prefix
                }
            }
        }
        
        return '';
    }

    function getCompatibilityInfo(product) {
        if (!product || !product.title) return '';
        
        // Try to extract model compatibility from title
        const title = product.title;
        
        // Look for common formats like "for Bizhub" or "compatible with"
        const compatMatches = title.match(/(?:for|compatible with)\s+((?:(?:Bizhub|Magicolor|PagePro)\s+[A-Z]?[0-9]+[a-z]*(?:\/[A-Za-z]+\s*[0-9]+[a-z]*)*),?\s*)+/i);
        
        if (compatMatches && compatMatches[1]) {
            return compatMatches[1].trim();
        }
        
        // Try to match based on part number
        const partNumber = extractPartNumber(product);
        if (partNumber && partToModelMap[partNumber]) {
            return `Compatible with: ${partToModelMap[partNumber].join(', ')}`;
        }
        
        return '';
    }

    const addToCart = (product) => {
        if (!product) return;
        
        const existingItem = cart.find((item) => item.id === product.id);
        
        if (existingItem) {
            const updatedCart = cart.map((item) =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
            setCart(updatedCart);
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };
    
    const renderSupplies = () => {
        if (isLoading) {
            return (
                <div className={moduleStyles.loaderContainer}>
                    <div className={moduleStyles.loader}></div>
                </div>
            );
        }
        
        if (!supplies || Object.keys(supplies).length === 0) {
            return (
                <div className={moduleStyles.emptyProductsContainer}>
                    <div className={moduleStyles.nothing}>
                        No supplies found for this model. Please try another search.
                    </div>
                </div>
            );
        }
        
        return (
            <div>
                <div className={moduleStyles.tabNavContainer}>
                    <div className={moduleStyles.tabNav}>
                        {Object.keys(supplies).map((supplyType) => (
                            <button
                                key={supplyType}
                                className={`${moduleStyles.tabButton} ${activeTab === supplyType ? moduleStyles.activeTab : ''}`}
                                onClick={() => setActiveTab(supplyType)}
                            >
                                {supplyType} ({supplies[supplyType].length})
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className={moduleStyles.suppliesBox}>
                    {activeTab && supplies[activeTab] && supplies[activeTab].length > 0 ? (
                        supplies[activeTab].map((product) => (
                            <div key={product.id} className={moduleStyles.supplyItem}>
                                <div className={moduleStyles.compatibilityBadge}>
                                    Compatible
                                </div>
                                
                                <div className={moduleStyles.supplyImage}>
                                    <Image
                                        src={product.images?.[0] || "/static/toner-placeholder.webp"}
                                        alt={product.title || "Konica Minolta Supply"}
                                        width={100}
                                        height={100}
                                        style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
                                    />
                                </div>
                                
                                <div className={moduleStyles.supplyDetails}>
                                    <div className={moduleStyles.partNumber}>
                                        Part #: {extractPartNumber(product)}
                                    </div>
                                    
                                    <h3 className={moduleStyles.supplyTitle}>
                                        {product.title}
                                    </h3>
                                    
                                    <div className={moduleStyles.compatibilityInfo}>
                                        {getCompatibilityInfo(product)}
                                    </div>
                                    
                                    <div className={moduleStyles.supplyPrice}>
                                        ${(() => {
                                            // Safely handle price calculation
                                            try {
                                                if (product.serviceLevels && 
                                                    product.serviceLevels[0] && 
                                                    typeof product.serviceLevels[0].price === 'number') {
                                                    return product.serviceLevels[0].price.toFixed(2);
                                                } else if (typeof product.price === 'number') {
                                                    return product.price.toFixed(2);
                                                } else {
                                                    return '0.00';
                                                }
                                            } catch (e) {
                                                return '0.00';
                                            }
                                        })()}
                                    </div>
                                </div>
                                
                                <div className={moduleStyles.supplyActions}>
                                    <button 
                                        className={moduleStyles.addToCartButton}
                                        onClick={() => addToCart(product)}
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={moduleStyles.noSupplies}>
                            No supplies available in this category.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.main}>
            <Header />
            
            <div className={styles.secondSection}>
                <div className={moduleStyles.modelNavigation}>
                    <Link href="/konika" className={moduleStyles.backToModels}>
                        ← Back to Konica Minolta Models
                    </Link>
                </div>
                
                <div className={moduleStyles.modelBox}>
                    <h2 className={moduleStyles.modelSubHeader}>
                        Konica Minolta {modelNumber} Supplies
                    </h2>
                </div>
                
                {renderSupplies()}
            </div>
            
            <Footer />
        </div>
    );
};

export default ModelSupplies; 