"use client";
import React, { useEffect, useRef, useState, useContext, useMemo } from "react";
import Header from "../../../components/Header";
import Image from "next/image";
import styles from "../../../page.module.css";
import Footer from "../../../components/Footer";
import Link from "next/link";
import { CartContext } from "../../../providers/cart";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import moduleStyles from "../../../modelSupplies/modelSupplies.module.css";
import OriginFilter from "../../../components/OriginFilter";

const ModelSupplies = () => {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const paramModel = params?.model;
    const queryModel = searchParams?.get("model");
    const modelNumber = paramModel || queryModel;
    
    const { cart, setCart } = useContext(CartContext);
    const [isLoading, setIsLoading] = useState(true);
    const [supplies, setSupplies] = useState([]);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(null);
    const [originFilters, setOriginFilters] = useState({
        usaMade: false,
        americasMade: false,
        worldWideMade: false,
        chineseMade: false
    });
    const [debugInfo, setDebugInfo] = useState({
        modelDetected: modelNumber,
        tokenStatus: 'unknown',
        apiCalls: 0,
        cacheStatus: 'unchecked'
    });

    // Define part number to model mapping for Lexmark
    const partToModelMap = {
        '71B10K0': ['CS317', 'CS417', 'CS517', 'CX317', 'CX417', 'CX517'], // Black
        '71B10C0': ['CS317', 'CS417', 'CS517', 'CX317', 'CX417', 'CX517'], // Cyan
        '71B10M0': ['CS317', 'CS417', 'CS517', 'CX317', 'CX417', 'CX517'], // Magenta
        '71B10Y0': ['CS317', 'CS417', 'CS517', 'CX317', 'CX417', 'CX517'], // Yellow
        '71B1HK0': ['CS317', 'CS417', 'CS517', 'CX317', 'CX417', 'CX517'], // Black High Yield
        '71B1HC0': ['CS317', 'CS417', 'CS517', 'CX317', 'CX417', 'CX517'], // Cyan High Yield
        '71B1HM0': ['CS317', 'CS417', 'CS517', 'CX317', 'CX417', 'CX517'], // Magenta High Yield
        '71B1HY0': ['CS317', 'CS417', 'CS517', 'CX317', 'CX417', 'CX517']  // Yellow High Yield
    };

    useEffect(() => {
        if (modelNumber) {
            getModelSupplies();
        } else {
            setError("Model number not found in URL");
            setIsLoading(false);
        }
    }, [modelNumber]);

    // Function to get a new authentication token
    async function refreshToken() {
        try {
            console.log("Attempting to refresh authentication token...");
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    username: process.env.NEXT_PUBLIC_DEFAULT_USERNAME || 'guest', 
                    password: process.env.NEXT_PUBLIC_DEFAULT_PASSWORD || 'guest123'
                })
            });
            
            if (!response.ok) {
                throw new Error(`Login failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data && data.accessToken) {
                console.log("Token refresh successful");
                // Store the new token
                localStorage.setItem("token", JSON.stringify(data));
                return data.accessToken;
            } else {
                throw new Error("Invalid response format from login API");
            }
        } catch (error) {
            console.error("Token refresh failed:", error);
            throw error;
        }
    }

    async function getModelSupplies() {
        try {
            setIsLoading(true);
            setError(null);
            
            // Check if user is logged in
            let accessToken = null;
            let needsRefresh = false;
            
            try {
                const tokenData = localStorage.getItem("token");
                if (tokenData) {
                    const aToken = JSON.parse(tokenData);
                    accessToken = aToken?.accessToken;
                    setDebugInfo(prev => ({...prev, tokenStatus: 'found'}));
                } else {
                    setDebugInfo(prev => ({...prev, tokenStatus: 'not found'}));
                    needsRefresh = true;
                }
            } catch (tokenError) {
                console.error('Token retrieval error:', tokenError);
                setDebugInfo(prev => ({...prev, tokenStatus: 'error reading'}));
                needsRefresh = true;
            }
            
            // Try to refresh token if needed
            if (needsRefresh || !accessToken) {
                try {
                    accessToken = await refreshToken();
                    setDebugInfo(prev => ({...prev, tokenStatus: 'refreshed'}));
                } catch (refreshError) {
                    console.error("Failed to refresh token:", refreshError);
                    setError("Authentication failed. Please go back to the home page and try again.");
                    setIsLoading(false);
                    return;
                }
            }
            
            if (!accessToken) {
                console.warn('No authentication token available');
                // Redirect to login page or home
                setError('Authentication required. Redirecting to home page...');
                setIsLoading(false);
                // Delay redirect to allow error message to be seen
                setTimeout(() => {
                    router.push('/');
                }, 2000);
                return;
            }

            // First try to get Lexmark products from cache
            let cachedProducts = [];
            try {
                const cachedData = localStorage.getItem("lexmark");
                if (cachedData) {
                    cachedProducts = JSON.parse(cachedData);
                    setDebugInfo(prev => ({...prev, cacheStatus: `found ${cachedProducts.length} items`}));
                } else {
                    setDebugInfo(prev => ({...prev, cacheStatus: 'not found'}));
                }
            } catch (cacheErr) {
                console.error('Error loading cached data:', cacheErr);
                setDebugInfo(prev => ({...prev, cacheStatus: 'error parsing'}));
            }

            // Normalize model number
            const normalizedModel = modelNumber.trim().toUpperCase();
            setDebugInfo(prev => ({...prev, modelDetected: normalizedModel}));
            
            // Create various patterns to match the model with different prefixes/formats
            const modelVariants = [
                normalizedModel,
                `CS${normalizedModel}`,
                `CX${normalizedModel}`,
                `MS${normalizedModel}`,
                `MX${normalizedModel}`
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
                    setDebugInfo(prev => ({...prev, productsFound: filteredProducts.length, source: 'cache'}));
                    setIsLoading(false);
                    return;
                } else {
                    setDebugInfo(prev => ({...prev, filteredCacheResults: 'no matches found'}));
                }
            }

            // If no cached products match or cache is empty, make API request
            const searchVariants = [
                `lexmark ${modelNumber}`,
                `lexmark cx${modelNumber}`,
                `lexmark cs${modelNumber}`
            ];

            let foundProducts = [];
            let apiCallsMade = 0;
            let tokenRefreshedDuringApiCalls = false;

            for (const searchVariant of searchVariants) {
                try {
                    apiCallsMade++;
                    setDebugInfo(prev => ({...prev, apiCalls: apiCallsMade}));
                    console.log(`Making API call for: ${searchVariant}`);
                    
                    let response = await fetch('/api/products', {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ 
                            token: accessToken, 
                            search: searchVariant
                        })
                    });
                    
                    // Check if token expired and retry once with a new token
                    if (!response.ok && response.status === 401 && !tokenRefreshedDuringApiCalls) {
                        try {
                            console.log("Token appears to be expired, attempting refresh...");
                            accessToken = await refreshToken();
                            tokenRefreshedDuringApiCalls = true;
                            
                            // Retry the API call with new token
                            response = await fetch('/api/products', {
                                method: "POST",
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ 
                                    token: accessToken, 
                                    search: searchVariant
                                })
                            });
                        } catch (refreshError) {
                            console.error("Failed to refresh token during API call:", refreshError);
                            throw new Error("Authentication failed. Please try again.");
                        }
                    }
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.warn(`Search for ${searchVariant} failed:`, response.status, errorText);
                        continue;
                    }
                    
                    const data = await response.json();
                    let productsArray = [];
                    
                    // Try to extract products from different possible response formats
                    if (data?.cancel?.products && Array.isArray(data.cancel.products)) {
                        productsArray = data.cancel.products;
                    } else if (data?.products && Array.isArray(data.products)) {
                        productsArray = data.products;
                    } else if (Array.isArray(data)) {
                        productsArray = data;
                    } else if (data?.data && Array.isArray(data.data)) {
                        productsArray = data.data;
                    } else if (data?.results && Array.isArray(data.results)) {
                        productsArray = data.results;
                    } else {
                        // Try to find any array in the response
                        for (const key in data) {
                            if (Array.isArray(data[key])) {
                                productsArray = data[key];
                                break;
                            } else if (data[key] && typeof data[key] === 'object') {
                                for (const subKey in data[key]) {
                                    if (Array.isArray(data[key][subKey])) {
                                        productsArray = data[key][subKey];
                                        break;
                                    }
                                }
                                if (productsArray.length > 0) break;
                            }
                        }
                    }
                    
                    const validProducts = productsArray.filter(product => 
                        product && 
                        product.title && 
                        (
                            (product.oemNos && Array.isArray(product.oemNos) && product.oemNos.length > 0) ||
                            (product.oem || product.partNumber)
                        ) &&
                        (
                            (product.serviceLevels && Array.isArray(product.serviceLevels) && product.serviceLevels.length > 0) ||
                            (typeof product.price !== 'undefined')
                        ) &&
                        modelVariants.some(variant => 
                            product.title.toUpperCase().includes(variant)
                        )
                    );
                    
                    if (validProducts.length > 0) {
                        foundProducts = [...foundProducts, ...validProducts];
                        setDebugInfo(prev => ({...prev, apiSuccess: true, foundCount: foundProducts.length}));
                    }
                } catch (apiError) {
                    console.error(`API request failed for ${searchVariant}:`, apiError);
                    setDebugInfo(prev => ({...prev, apiError: apiError.message}));
                }
            }
            
            if (foundProducts.length > 0) {
                setSupplies(foundProducts);
                // Save to both lexmark cache and model-specific cache
                localStorage.setItem("lexmark", JSON.stringify([...cachedProducts, ...foundProducts]));
                localStorage.setItem(`lexmark_model_${modelNumber}`, JSON.stringify(foundProducts));
                setDebugInfo(prev => ({...prev, productsFound: foundProducts.length, source: 'api'}));
            } else {
                // Create fallback products based on known part numbers
                const fallbackProducts = [];
                
                // Check if current model matches any in our part mapping
                for (const [partNumber, compatibleModels] of Object.entries(partToModelMap)) {
                    if (compatibleModels.some(model => 
                        modelVariants.some(variant => variant.includes(model)))) {
                        
                        // Add appropriate fallback products
                        fallbackProducts.push({
                            id: `${partNumber}-fallback`,
                            title: `Lexmark ${partNumber} Toner Cartridge (Compatible with ${normalizedModel})`,
                            oemNos: [{ oemNo: partNumber }],
                            serviceLevels: [{ price: 89.99 }],
                            images: ["/static/toner-placeholder.webp"]
                        });
                    }
                }
                
                if (fallbackProducts.length > 0) {
                    setSupplies(fallbackProducts);
                    setDebugInfo(prev => ({...prev, productsFound: fallbackProducts.length, source: 'fallback'}));
                } else {
                    setError(`No products found for model ${normalizedModel}. Please try a different model.`);
                    setDebugInfo(prev => ({...prev, productsFound: 0, source: 'none'}));
                }
            }
            
            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching model supplies:', err);
            setError(`Error loading products: ${err.message}`);
            setSupplies([]);
            setDebugInfo(prev => ({...prev, mainError: err.message}));
            setIsLoading(false);
        }
    }

    // Helper function to extract OEM part number from product
    const extractPartNumber = (product) => {
        if (!product) return 'N/A';
        
        // Try from oemNos array
        if (product.oemNos && Array.isArray(product.oemNos) && product.oemNos.length > 0) {
            for (const oem of product.oemNos) {
                if (oem && oem.oemNo) return oem.oemNo;
            }
        }
        
        // Try from direct properties
        if (product.oem) return product.oem;
        if (product.partNumber) return product.partNumber;
        
        return 'N/A';
    };

    // Helper function to check if a product is compatible with the current model
    const getCompatibilityInfo = (product) => {
        if (!product) return null;
        
        const partNumber = extractPartNumber(product);
        
        if (partNumber && partToModelMap[partNumber]) {
            return {
                models: partToModelMap[partNumber],
                description: `Compatible with: ${partToModelMap[partNumber].join(', ')}`
            };
        }
        
        return null;
    };

    // Simple function to get product price
    const getProductPrice = (product) => {
        if (!product) return '0.00';
        
        try {
            // Try serviceLevels first
            if (product.serviceLevels && 
                Array.isArray(product.serviceLevels) && 
                product.serviceLevels.length > 0 &&
                product.serviceLevels[0].price !== undefined) {
                // Convert to number first to ensure toFixed works
                const price = parseFloat(product.serviceLevels[0].price);
                return isNaN(price) ? '0.00' : price.toFixed(2);
            }
            
            // Try direct price property
            if (product.price !== undefined) {
                const price = parseFloat(product.price);
                return isNaN(price) ? '0.00' : price.toFixed(2);
            }
        } catch (e) {
            console.error('Error calculating price:', e);
        }
        
        return '0.00';
    };

    // Handle origin filter changes
    const handleOriginFilterChange = (filters) => {
        setOriginFilters(filters);
    };

    // Filter products by origin
    const filterProductsByOrigin = (products) => {
        // Log the active filters
        console.log("Lexmark - Active origin filters:", JSON.stringify(originFilters));
        
        // Safety check for null/undefined products
        if (!products || !Array.isArray(products)) {
            console.error("Lexmark - Products is not an array:", products);
            return [];
        }
        
        // If no filters are active, return all products
        if (!originFilters.usaMade && !originFilters.americasMade && !originFilters.worldWideMade) {
            console.log("Lexmark - No origin filters active, returning all products:", products.length);
            return products;
        }

        // Log a sample of product origins
        const sampleSize = Math.min(products.length, 5);
        const originSamples = products.slice(0, sampleSize).map(p => p.origin || 'unknown');
        console.log(`Lexmark - Origin samples from ${products.length} products:`, originSamples);

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
        
        console.log(`Lexmark - Filtered products: ${filtered.length} out of ${products.length}`);
        return filtered;
    };

    // Filter supplies by type based on active tab
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
                    item.title?.toLowerCase().includes("toner") && 
                    !item.title?.toLowerCase().includes("waste")
                );
            case "waste":
                return originFiltered.filter(item => 
                    item.title?.toLowerCase().includes("waste") || 
                    item.title?.toLowerCase().includes("collection")
                );
            case "imaging":
                return originFiltered.filter(item => 
                    item.title?.toLowerCase().includes("imaging") || 
                    item.title?.toLowerCase().includes("drum") || 
                    item.title?.toLowerCase().includes("developer")
                );
            default:
                return originFiltered;
        }
    };

    // Prepare supplies with additional information for rendering
    const preparedSupplies = useMemo(() => {
        return filterSuppliesByType().map(product => ({
            ...product,
            key: product.id || (product.oemNos?.[0]?.oemNo + '-' + Math.random().toString(36).substring(7)),
            partNumber: extractPartNumber(product),
            compatInfo: getCompatibilityInfo(product),
            price: getProductPrice(product)
        }));
    }, [supplies, activeTab, originFilters]);

    // Define some inline styles for the diagnostic box
    const debugStyle = {
        padding: '10px',
        margin: '10px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        backgroundColor: '#f5f5f5',
        fontSize: '12px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap'
    };

    // Define some inline styles for product card
    const cardStyle = {
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '15px',
        margin: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '280px'
    };

    const imageStyle = {
        width: '150px',
        height: '150px',
        objectFit: 'contain',
        marginBottom: '10px'
    };

    const titleStyle = {
        fontSize: '14px',
        fontWeight: 'bold',
        margin: '10px 0',
        textAlign: 'center'
    };

    const priceStyle = {
        color: '#0066cc',
        fontSize: '18px',
        fontWeight: 'bold',
        margin: '10px 0'
    };

    const buttonStyle = {
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '10px 15px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        width: '100%',
        marginTop: '10px'
    };

    const gridStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '20px',
        padding: '20px'
    };

    const loaderStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px'
    };

    const simpleLoaderStyle = {
        border: '6px solid #f3f3f3',
        borderTop: '6px solid #3498db',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        animation: 'spin 2s linear infinite',
    };

    const errorStyle = {
        color: 'red',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#ffecec',
        borderRadius: '8px',
        margin: '20px'
    };

    const headerStyle = {
        textAlign: 'center',
        padding: '20px 0',
        backgroundColor: '#f9f9f9',
        marginBottom: '20px'
    };

    const handleRetry = () => {
        setError(null);
        setIsLoading(true);
        getModelSupplies();
    };

    return (
        <div>
            <Header />

            <div style={headerStyle}>
                <h1>Lexmark Supplies</h1>
                <div>
                    <Link href="/lexmark" style={{color: '#0066cc', textDecoration: 'none'}}>
                        &laquo; Back to All Models
                    </Link>
                </div>
                <h2>Model: {modelNumber}</h2>
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

                {/* Origin Filter - RESTORED */}
                <div style={{width: 'auto', minWidth: '250px'}}>
                    <OriginFilter onFilterChange={handleOriginFilterChange} />
                </div>
            </div>

            {/* Diagnostic info */}
            <div style={debugStyle}>
                <h3>Diagnostic Info:</h3>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>

            {isLoading ? (
                <div style={loaderStyle}>
                    <div style={simpleLoaderStyle}></div>
                </div>
            ) : error ? (
                <div style={errorStyle}>
                    <p>{error}</p>
                    <button 
                        style={{...buttonStyle, backgroundColor: '#0066cc'}} 
                        onClick={handleRetry}
                    >
                        Try Again
                    </button>
                </div>
            ) : !preparedSupplies || preparedSupplies.length === 0 ? (
                <div style={errorStyle}>
                    <p>No supplies found for this model.</p>
                    <button 
                        style={{...buttonStyle, backgroundColor: '#0066cc'}} 
                        onClick={handleRetry}
                    >
                        Try Again
                    </button>
                </div>
            ) : (
                <div style={gridStyle}>
                    {preparedSupplies.map((item) => (
                        <div key={item.key} style={cardStyle}>
                            <div>
                                <img
                                    src={item.images?.[0] || "/static/toner-placeholder.webp"}
                                    alt={item.title || "Product image"}
                                    style={imageStyle}
                                />
                            </div>
                            
                            <div style={titleStyle}>
                                Part #: {item.partNumber}
                            </div>
                            
                            <div style={titleStyle}>
                                {item.title}
                            </div>
                            
                            {item.compatInfo && (
                                <div style={{fontSize: '12px', color: '#666', margin: '5px 0', textAlign: 'center'}}>
                                    {item.compatInfo.description}
                                </div>
                            )}
                            
                            <div style={priceStyle}>
                                ${item.price}
                            </div>
                            
                            <button 
                                style={buttonStyle}
                                onClick={() => {
                                    const existingItem = cart.find((cartItem) => cartItem.id === item.id);
                                    if (existingItem) {
                                        setCart(cart.map((cartItem) =>
                                            cartItem.id === item.id
                                                ? { ...cartItem, quantity: cartItem.quantity + 1 }
                                                : cartItem
                                        ));
                                    } else {
                                        setCart([...cart, { ...item, quantity: 1 }]);
                                    }
                                }}
                            >
                                Add to Cart
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <Footer />
            
            <style jsx global>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ModelSupplies; 