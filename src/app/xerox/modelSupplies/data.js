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
    const [supplies, setSupplies] = useState({});
    
    // Define Xerox part number to model mapping
    const partToModelMap = {
        // Xerox Phaser series
        '106R02777': ['Phaser 3260', 'WorkCentre 3215', 'WorkCentre 3225'],
        '106R03580': ['Phaser 3330', 'WorkCentre 3335', 'WorkCentre 3345'],
        '106R01159': ['Phaser 3117', 'Phaser 3122', 'Phaser 3124', 'Phaser 3125'],
        '106R01374': ['Phaser 3250', 'Phaser 3250D', 'Phaser 3250DN'],
        '106R01634': ['Phaser 6000', 'Phaser 6010', 'WorkCentre 6015'], // Cyan
        '106R01633': ['Phaser 6000', 'Phaser 6010', 'WorkCentre 6015'], // Magenta
        '106R01632': ['Phaser 6000', 'Phaser 6010', 'WorkCentre 6015'], // Yellow
        '106R01631': ['Phaser 6000', 'Phaser 6010', 'WorkCentre 6015'], // Black
        
        // Xerox VersaLink series
        '106R03941': ['VersaLink B400', 'VersaLink B405'],
        '106R03942': ['VersaLink B400', 'VersaLink B405'],
        '106R03945': ['VersaLink C400', 'VersaLink C405'], // Black
        '106R03946': ['VersaLink C400', 'VersaLink C405'], // Cyan
        '106R03947': ['VersaLink C400', 'VersaLink C405'], // Magenta
        '106R03948': ['VersaLink C400', 'VersaLink C405'], // Yellow
        
        // Xerox WorkCentre series
        '106R02778': ['WorkCentre 3215', 'WorkCentre 3225', 'Phaser 3260'],
        '106R02782': ['WorkCentre 3335', 'WorkCentre 3345', 'Phaser 3330'],
        '106R03624': ['WorkCentre 3655', 'WorkCentre 3655i'],
        '106R01486': ['WorkCentre 3210', 'WorkCentre 3220'],
        '106R01487': ['WorkCentre 3210', 'WorkCentre 3220'],
        
        // Xerox AltaLink series
        '106R04059': ['AltaLink C8030', 'AltaLink C8035', 'AltaLink C8045', 'AltaLink C8055', 'AltaLink C8070'], // Black
        '106R04060': ['AltaLink C8030', 'AltaLink C8035', 'AltaLink C8045', 'AltaLink C8055', 'AltaLink C8070'], // Cyan
        '106R04061': ['AltaLink C8030', 'AltaLink C8035', 'AltaLink C8045', 'AltaLink C8055', 'AltaLink C8070'], // Magenta
        '106R04062': ['AltaLink C8030', 'AltaLink C8035', 'AltaLink C8045', 'AltaLink C8055', 'AltaLink C8070']  // Yellow
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

            // Normalize model number
            const normalizedModel = modelNumber.trim().toUpperCase().replace(/^XEROX\s+/i, '');
            
            // Create various patterns to match the model with different prefixes/formats
            const modelVariants = [
                normalizedModel,
                `XEROX ${normalizedModel}`,
                `PHASER ${normalizedModel.replace(/^PHASER\s*/, '')}`,
                `WORKCENTRE ${normalizedModel.replace(/^WORKCENTRE\s*/, '')}`,
                `VERSALINK ${normalizedModel.replace(/^VERSALINK\s*/, '')}`,
                `ALTALINK ${normalizedModel.replace(/^ALTALINK\s*/, '')}`
            ];
            
            // Extract the base model number (remove letters and suffixes)
            const baseModelMatch = normalizedModel.match(/([0-9]+)/);
            const baseModel = baseModelMatch ? baseModelMatch[1] : normalizedModel;
            
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
            
            // If no products found in cache or no matches, try API
            const requestOptions = {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: accessToken,
                    search: `xerox ${modelNumber}`
                })
            };
            
            try {
                const response = await fetch('/api/products', requestOptions);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Extract products based on response format
                let products = [];
                if (data.cancel && Array.isArray(data.cancel.products)) {
                    products = data.cancel.products;
                } else if (data.products && Array.isArray(data.products)) {
                    products = data.products;
                } else if (Array.isArray(data)) {
                    products = data;
                }
                
                if (products.length > 0) {
                    const groupedSupplies = groupSuppliesByType(products);
                    setSupplies(groupedSupplies);
                    setActiveTab(Object.keys(groupedSupplies)[0] || null);
                } else {
                    setSupplies({});
                }
            } catch (apiError) {
                console.error('API request failed:', apiError);
                setSupplies({});
            }
        } catch (err) {
            console.error('Error fetching model supplies:', err);
            setSupplies({});
        } finally {
            setIsLoading(false);
        }
    }

    // Helper function to categorize Xerox models
    const getCategoryFromModel = (modelNumber) => {
        if (!modelNumber) return "Other";
        
        const model = modelNumber.toUpperCase();
        
        if (model.includes('PHASER')) return "Phaser";
        if (model.includes('WORKCENTRE')) return "WorkCentre";
        if (model.includes('VERSALINK')) return "VersaLink";
        if (model.includes('ALTALINK')) return "AltaLink";
        
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
                supplyType = "Drum Units";
            } else if (title.includes('MAINTENANCE') || title.includes('FUSER')) {
                supplyType = "Maintenance Kits";
            } else if (title.includes('WASTE')) {
                supplyType = "Waste Containers";
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
            // Common Xerox part number patterns
            const patterns = [
                /\b(106R[0-9]{5})\b/i,  // e.g., 106R02777
                /\b(113R[0-9]{5})\b/i,  // e.g., 113R00755 (drum units)
                /\b(108R[0-9]{5})\b/i   // e.g., 108R00909 (maintenance items)
            ];
            
            for (const pattern of patterns) {
                const match = product.title.match(pattern);
                if (match && match[1]) {
                    return match[1];
                }
            }
        }
        
        return '';
    }

    function getCompatibilityInfo(product) {
        if (!product || !product.title) return '';
        
        // Try to extract model compatibility from title
        const title = product.title;
        
        // Look for common formats like "for Phaser series" or "compatible with"
        const compatMatches = title.match(/(?:for|compatible with)\s+((?:(?:Phaser|WorkCentre|VersaLink|AltaLink)\s+[0-9]+[a-z]*(?:\/[A-Za-z]+\s*[0-9]+[a-z]*)*),?\s*)+/i);
        
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
        
        if (!supplies || typeof supplies !== 'object' || Object.keys(supplies).length === 0) {
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
                                {supplyType} ({supplies[supplyType]?.length || 0})
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className={moduleStyles.suppliesBox}>
                    {activeTab && supplies[activeTab] && Array.isArray(supplies[activeTab]) && supplies[activeTab].length > 0 ? (
                        supplies[activeTab].map((product) => (
                            product && product.id ? (
                                <div key={product.id} className={moduleStyles.supplyItem}>
                                    <div className={moduleStyles.compatibilityBadge}>
                                        Compatible
                                    </div>
                                    
                                    <div className={moduleStyles.supplyImage}>
                                        <Image
                                            src={product.images?.[0] || "/static/toner-placeholder.webp"}
                                            alt={product.title || "Xerox Supply"}
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
                            ) : null
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
                    <Link href="/xerox" className={moduleStyles.backToModels}>
                        ← Back to Xerox Models
                    </Link>
                </div>
                
                <div className={moduleStyles.modelBox}>
                    <h2 className={moduleStyles.modelSubHeader}>
                        Xerox {modelNumber} Supplies
                    </h2>
                </div>
                
                {renderSupplies()}
            </div>
            
            <Footer />
        </div>
    );
};

export default ModelSupplies; 