"use client";
import React, { useEffect, useRef, useState, useContext, useCallback } from "react";
import Header from "../../components/Header";
import Image from "next/image";
import styles from "../../page.module.css";
import Footer from "../../components/Footer";
import Link from "next/link";
import { CartContext } from "../../providers/cart";
import { useSearchParams } from "next/navigation";
import moduleStyles from "./modelSupplies.module.css";
import OriginFilter from "../../components/OriginFilter";

const ModelSupplies = () => {
    const searchParams = useSearchParams();
    const modelNumber = searchParams.get("model");
    const { cart, setCart } = useContext(CartContext);
    const [activeTab, setActiveTab] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [supplies, setSupplies] = useState({});
    const [originFilters, setOriginFilters] = useState({
        usaMade: false,
        americasMade: false,
        worldWideMade: false,
        chineseMade: false
    });
    
    // Define Dell part number to model mapping
    const partToModelMap = {
        // Dell Mono printers
        '331-7327': ['B1260', 'B1265', 'B1265dnf'],
        '331-7328': ['B1260', 'B1265', 'B1265dnf'],
        '593-BBKD': ['B2360', 'B2360d', 'B2360dn', 'B3460', 'B3460dn', 'B3465', 'B3465dn', 'B3465dnf'],
        '593-BBKC': ['B2360', 'B2360d', 'B2360dn', 'B3460', 'B3460dn', 'B3465', 'B3465dn', 'B3465dnf'],
        '593-BBJX': ['B3465', 'B3465dn', 'B3465dnf'],
        '593-BBMF': ['B5460', 'B5460dn', 'B5465', 'B5465dnf'],
        '593-BBME': ['B5460', 'B5460dn', 'B5465', 'B5465dnf'],
        
        // Dell B laser printers
        'RGCN6': ['B1160', 'B1160w', 'B1165nfw'],
        'DRYXV': ['B1160', 'B1160w', 'B1165nfw'],
        'PVTHG': ['B1260', 'B1265', 'B1265dnf'],
        'C3NTP': ['B2375', 'B2375dnf', 'B2375dfw'],
        
        // Dell Color Laser
        '593-BBBU': ['C2660', 'C2660dn', 'C2665', 'C2665dnf'], // Black
        '593-BBBT': ['C2660', 'C2660dn', 'C2665', 'C2665dnf'], // Cyan
        '593-BBBS': ['C2660', 'C2660dn', 'C2665', 'C2665dnf'], // Magenta
        '593-BBBR': ['C2660', 'C2660dn', 'C2665', 'C2665dnf'], // Yellow
        '331-8429': ['C3760', 'C3760dn', 'C3760n', 'C3765', 'C3765dnf'], // Black
        '331-8432': ['C3760', 'C3760dn', 'C3760n', 'C3765', 'C3765dnf'], // Cyan
        '331-8431': ['C3760', 'C3760dn', 'C3760n', 'C3765', 'C3765dnf'], // Magenta
        '331-8430': ['C3760', 'C3760dn', 'C3760n', 'C3765', 'C3765dnf'], // Yellow
        
        // Dell Multifunction printers
        '593-BBLH': ['E310', 'E310dw', 'E514', 'E514dw', 'E515', 'E515dn', 'E515dw'],
        '593-BBLZ': ['E310', 'E310dw', 'E514', 'E514dw', 'E515', 'E515dn', 'E515dw'],
        '593-BBLN': ['E514', 'E514dw', 'E515', 'E515dn', 'E515dw'],
        '593-BBKH': ['H625', 'H625cdw', 'H825', 'H825cdw', 'S2825', 'S2825cdn'], // Black
        '593-BBKL': ['H625', 'H625cdw', 'H825', 'H825cdw', 'S2825', 'S2825cdn'], // Cyan
        '593-BBKJ': ['H625', 'H625cdw', 'H825', 'H825cdw', 'S2825', 'S2825cdn'], // Magenta
        '593-BBKI': ['H625', 'H625cdw', 'H825', 'H825cdw', 'S2825', 'S2825cdn']  // Yellow
    };

    // Handle origin filter changes
    const handleOriginFilterChange = (filters) => {
        setOriginFilters(filters);
    };

    // Filter products by origin
    const filterProductsByOrigin = (products) => {
        // Log the active filters
        console.log("Dell - Active origin filters:", JSON.stringify(originFilters));
        
        // Safety check for null/undefined products
        if (!products || !Array.isArray(products)) {
            console.error("Dell - Products is not an array:", products);
            return [];
        }
        
        // If no filters are active, return all products
        if (!originFilters.usaMade && !originFilters.americasMade && !originFilters.worldWideMade) {
            console.log("Dell - No origin filters active, returning all products:", products.length);
            return products;
        }

        // Log a sample of product origins
        const sampleSize = Math.min(products.length, 5);
        const originSamples = products.slice(0, sampleSize).map(p => p.origin || 'unknown');
        console.log(`Dell - Origin samples from ${products.length} products:`, originSamples);

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
                // Only show Chinese products if the Chinese toggle is on
                if (origin.includes('china')) {
                    return originFilters.chineseMade;
                }
                // For all other worldwide products, show them
                return !origin.includes('china') || originFilters.chineseMade;
            }
            
            return false;
        });
        
        console.log(`Dell - Filtered products: ${filtered.length} out of ${products.length}`);
        return filtered;
    };

    // Group supplies by their type (toner, drum, etc.)
    const groupSuppliesByType = (products) => {
        if (!products || !Array.isArray(products) || products.length === 0) {
            return {};
        }
        
        // First filter by origin if any filters are active
        const filteredProducts = filterProductsByOrigin(products);
        if (!filteredProducts.length) {
            return {};
        }
        
        const groupedSupplies = {};
        
        filteredProducts.forEach(product => {
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

    // Wrap getModelSupplies in useCallback to prevent it from changing on every render
    const getModelSupplies = useCallback(async () => {
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

            // First try to get Dell products from cache
            let cachedProducts = [];
            try {
                const cachedData = localStorage.getItem("dell");
                if (cachedData) {
                    cachedProducts = JSON.parse(cachedData);
                }
            } catch (cacheErr) {
                console.error('Error loading cached data:', cacheErr);
            }

            // Normalize model number
            const normalizedModel = modelNumber.trim().toUpperCase().replace(/^DELL\s+/i, '');
            
            // Create various patterns to match the model with different prefixes/formats
            const modelVariants = [
                normalizedModel,
                `DELL ${normalizedModel}`,
                `MODEL ${normalizedModel}`,
                `PRINTER ${normalizedModel}`,
                `${normalizedModel.replace(/^[A-Z]+/, '')}` // Try without series prefix
            ];
            
            // Extract the base model number (remove letters and suffixes)
            const baseModelMatch = normalizedModel.match(/([A-Z][0-9]+)/i);
            const baseModel = baseModelMatch ? baseModelMatch[0].toUpperCase() : normalizedModel;
            
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
                    search: `dell ${modelNumber}`
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
    }, [modelNumber]);

    // Helper function to categorize Dell models
    const getCategoryFromModel = (modelNumber) => {
        if (!modelNumber) return "Other";
        
        const model = modelNumber.toUpperCase();
        
        if (model.startsWith('B')) return "B Series";
        if (model.startsWith('C')) return "C Series";
        if (model.startsWith('E')) return "E Series";
        if (model.startsWith('H')) return "H Series";
        if (model.startsWith('S')) return "S Series";
        
        return "Other";
    };

    useEffect(() => {
        if (modelNumber) {
            getModelSupplies();
        }
    }, [modelNumber, getModelSupplies]);

    // Reset active tab when the origin filters change
    useEffect(() => {
        // Get raw products array from all categories
        if (supplies && typeof supplies === 'object') {
            const allProducts = [];
            Object.values(supplies).forEach(categoryProducts => {
                if (Array.isArray(categoryProducts)) {
                    allProducts.push(...categoryProducts);
                }
            });
            
            // Regroup the products with the new filters applied
            if (allProducts.length > 0) {
                const groupedSupplies = groupSuppliesByType(allProducts);
                setSupplies(groupedSupplies);
                
                // If current tab no longer exists after filtering, select the first available tab
                if (!groupedSupplies[activeTab]) {
                    setActiveTab(Object.keys(groupedSupplies)[0] || null);
                }
            }
        }
    }, [originFilters]);

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
            // Common Dell part number patterns
            const patterns = [
                /\b(593-[A-Z]{4})\b/i,  // e.g., 593-BBKD
                /\b(331-[0-9]{4})\b/i,  // e.g., 331-7328
                /\b([A-Z0-9]{5})\b/i,    // e.g., RGCN6, DRYXV
                /\bpart\s+#\s*([A-Z0-9-]+)/i  // "Part # XXX-XXXX"
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
        
        // Look for common formats like "for B2360" or "compatible with"
        const compatMatches = title.match(/(?:for|compatible with)\s+((?:(?:Dell\s+)?[A-Z][0-9]+[a-z]*(?:\/[A-Z][0-9]+[a-z]*)*),?\s*)+/i);
        
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
                
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '0 20px', flexWrap: 'wrap'}}>
                    {/* Tab Navigation */}
                    <div style={{flex: '1', marginRight: '20px', minWidth: '300px'}}>
                        {/* Tab controls would go here if needed */}
                    </div>
                    
                    {/* Origin Filter */}
                    <div style={{width: 'auto', minWidth: '250px'}}>
                        <OriginFilter onFilterChange={handleOriginFilterChange} />
                    </div>
                </div>
                
                <div key="supplies-box" className={moduleStyles.suppliesBox}>
                    {activeTab && supplies[activeTab] && supplies[activeTab].length > 0 ? (
                        supplies[activeTab].map((product, index) => (
                            <div key={product.id || `product-${index}`} className={moduleStyles.supplyItem}>
                                <div className={moduleStyles.compatibilityBadge}>
                                    Compatible
                                </div>
                                
                                <div className={moduleStyles.supplyImage}>
                                    <Image
                                        src={product.images?.[0] || "/static/toner-placeholder.webp"}
                                        alt={product.title || "Dell Supply"}
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
                    <Link href="/dell" className={moduleStyles.backToModels}>
                        ← Back to Dell Models
                    </Link>
                </div>
                
                <div className={moduleStyles.modelBox}>
                    <h2 className={moduleStyles.modelSubHeader}>
                        Dell {modelNumber} Supplies
                    </h2>
                </div>
                
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '0 20px', flexWrap: 'wrap'}}>
                    {/* Tab Navigation */}
                    <div style={{flex: '1', marginRight: '20px', minWidth: '300px'}}>
                        {/* Tab controls would go here if needed */}
                    </div>
                    
                    {/* Origin Filter */}
                    <div style={{width: 'auto', minWidth: '250px'}}>
                        <OriginFilter onFilterChange={handleOriginFilterChange} />
                    </div>
                </div>
                
                {renderSupplies()}
            </div>
            
            <Footer />
        </div>
    );
};

export default ModelSupplies; 