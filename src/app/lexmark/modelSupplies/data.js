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
    
    // Define Lexmark part number to model mapping
    const partToModelMap = {
        // Lexmark MS/MX series
        '51B1000': ['MS317', 'MS417', 'MS517', 'MS617', 'MX317', 'MX417', 'MX517', 'MX617'],
        '51B1H00': ['MS317', 'MS417', 'MS517', 'MS617', 'MX317', 'MX417', 'MX517', 'MX617'],
        '50F1000': ['MS310', 'MS312', 'MS315', 'MS410', 'MS415', 'MS510', 'MS610'],
        '50F1H00': ['MS310', 'MS312', 'MS315', 'MS410', 'MS415', 'MS510', 'MS610'],
        '51B0XA0': ['MS521', 'MS621', 'MS622', 'MX521', 'MX522', 'MX622'],
        '56F1000': ['MS321', 'MS421', 'MS521', 'MS621', 'MX321', 'MX421', 'MX521', 'MX621'],
        '56F1H00': ['MS321', 'MS421', 'MS521', 'MS621', 'MX321', 'MX421', 'MX521', 'MX621'],
        
        // Lexmark B series
        'B221000': ['B2236', 'MB2236'],
        'B221H00': ['B2236', 'MB2236'],
        'B232000': ['B2338', 'B2442', 'B2546', 'B2650', 'MB2338', 'MB2442', 'MB2546', 'MB2650'],
        'B232H00': ['B2338', 'B2442', 'B2546', 'B2650', 'MB2338', 'MB2442', 'MB2546', 'MB2650'],
        'B241000': ['B2442', 'B2546', 'B2650', 'MB2442', 'MB2546', 'MB2650'],
        'B241H00': ['B2442', 'B2546', 'B2650', 'MB2442', 'MB2546', 'MB2650'],

        // Lexmark CS/CX series
        '71B10K0': ['CS317', 'CS417', 'CS517', 'CX317', 'CX417', 'CX517'], // Black
        '71B10C0': ['CS317', 'CS417', 'CS517', 'CX317', 'CX417', 'CX517'], // Cyan
        '71B10M0': ['CS317', 'CS417', 'CS517', 'CX317', 'CX417', 'CX517'], // Magenta
        '71B10Y0': ['CS317', 'CS417', 'CS517', 'CX317', 'CX417', 'CX517'], // Yellow
        '71B1HK0': ['CS317', 'CS417', 'CS517', 'CX317', 'CX417', 'CX517'], // Black High Yield
        '71B1HC0': ['CS317', 'CS417', 'CS517', 'CX317', 'CX417', 'CX517'], // Cyan High Yield
        '71B1HM0': ['CS317', 'CS417', 'CS517', 'CX317', 'CX417', 'CX517'], // Magenta High Yield
        '71B1HY0': ['CS317', 'CS417', 'CS517', 'CX317', 'CX417', 'CX517'], // Yellow High Yield
        
        // Lexmark C series
        'C232HK0': ['C2325', 'C2425', 'C2535', 'MC2325', 'MC2425', 'MC2535', 'MC2640'], // Black
        'C232HC0': ['C2325', 'C2425', 'C2535', 'MC2325', 'MC2425', 'MC2535', 'MC2640'], // Cyan
        'C232HM0': ['C2325', 'C2425', 'C2535', 'MC2325', 'MC2425', 'MC2535', 'MC2640'], // Magenta
        'C232HY0': ['C2325', 'C2425', 'C2535', 'MC2325', 'MC2425', 'MC2535', 'MC2640']  // Yellow
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

            // First try to get Lexmark products from cache
            let cachedProducts = [];
            try {
                const cachedData = localStorage.getItem("lexmark");
                if (cachedData) {
                    cachedProducts = JSON.parse(cachedData);
                }
            } catch (cacheErr) {
                console.error('Error loading cached data:', cacheErr);
            }

            // Normalize model number
            const normalizedModel = modelNumber.trim().toUpperCase().replace(/^LEXMARK\s+/i, '');
            
            // Create various patterns to match the model with different prefixes/formats
            const modelVariants = [
                normalizedModel,
                `LEXMARK ${normalizedModel}`,
                `MS ${normalizedModel.replace(/^MS/, '')}`,
                `MX ${normalizedModel.replace(/^MX/, '')}`,
                `CS ${normalizedModel.replace(/^CS/, '')}`,
                `CX ${normalizedModel.replace(/^CX/, '')}`,
                `B ${normalizedModel.replace(/^B/, '')}`,
                `MB ${normalizedModel.replace(/^MB/, '')}`
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
                    search: `lexmark ${modelNumber}`
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

    // Helper function to categorize Lexmark models
    const getCategoryFromModel = (modelNumber) => {
        if (!modelNumber) return "Other";
        
        const model = modelNumber.toUpperCase();
        
        if (model.includes('MS') || model.includes('MX')) return "Monochrome";
        if (model.includes('CS') || model.includes('CX')) return "Color";
        if (model.startsWith('B') || model.startsWith('MB')) return "B Series";
        
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
            // Common Lexmark part number patterns
            const patterns = [
                /\b([0-9]{2}[A-Z][0-9]{4})\b/i,  // e.g., 51B1000
                /\b([0-9]{2}[A-Z][0-9][A-Z]{2}[0-9])\b/i, // e.g., 71B10K0
                /\b([A-Z][0-9]{3}[A-Z]{2}[0-9])\b/i  // e.g., C232HK0
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
        
        // Look for common formats like "for MS/MX Series" or "compatible with"
        const compatMatches = title.match(/(?:for|compatible with)\s+((?:(?:[A-Z]+[0-9]+[a-z]*(?:\/[A-Z]+[0-9]+[a-z]*)*),?\s*)+)/i);
        
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
                                        alt={product.title || "Lexmark Supply"}
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
                    <Link href="/lexmark" className={moduleStyles.backToModels}>
                        ← Back to Lexmark Models
                    </Link>
                </div>
                
                <div className={moduleStyles.modelBox}>
                    <h2 className={moduleStyles.modelSubHeader}>
                        Lexmark {modelNumber} Supplies
                    </h2>
                </div>
                
                {renderSupplies()}
            </div>
            
            <Footer />
        </div>
    );
};

export default ModelSupplies; 