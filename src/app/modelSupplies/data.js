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
    const [activeTab, setActiveTab] = useState("toner");
    const [isLoading, setIsLoading] = useState(true);
    const [supplies, setSupplies] = useState([]);

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

            // If we have cached products, filter them by model number variants
            if (cachedProducts && cachedProducts.length > 0) {
                const filteredProducts = cachedProducts.filter(product => {
                    if (!product || !product.title) return false;
                    
                    const title = product.title.toUpperCase();
                    return modelVariants.some(variant => title.includes(variant));
                });
                
                if (filteredProducts.length > 0) {
                    console.log('Using cached products for model:', modelNumber);
                    setSupplies(filteredProducts);
                    setIsLoading(false);
                    return;
                }
            }

            // If no cached products match or cache is empty, make API request
            // Try multiple search terms to increase chances of finding the model
            for (const searchVariant of [`konica ${modelNumber}`, `bizhub ${modelNumber}`, `konica bizhub ${modelNumber}`]) {
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
                        // Validate and filter products to match the model number
                        const validProducts = data.cancel.products
                            .filter(product => 
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
                            return;
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
                        return;
                    }
                }
            } catch (cacheErr) {
                console.error('Error loading model cache:', cacheErr);
            }
            
            // If still no results, create fallback products
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
        } catch (err) {
            console.error('Error fetching model supplies:', err);
            setSupplies([]);
        } finally {
            setIsLoading(false);
        }
    }

    const filterSuppliesByType = () => {
        if (!supplies || supplies.length === 0) {
            return [];
        }

        switch (activeTab) {
            case "toner":
                return supplies.filter(item => 
                    item.title.toLowerCase().includes("toner") && 
                    !item.title.toLowerCase().includes("waste")
                );
            case "waste":
                return supplies.filter(item => 
                    item.title.toLowerCase().includes("waste") || 
                    item.title.toLowerCase().includes("collection")
                );
            case "imaging":
                return supplies.filter(item => 
                    item.title.toLowerCase().includes("imaging") || 
                    item.title.toLowerCase().includes("drum") || 
                    item.title.toLowerCase().includes("developer")
                );
            case "all":
            default:
                return supplies;
        }
    };

    return (
        <div className={styles.main}>
            <Header />

            <div className={styles.secondSection}>
                <div className={styles.flexSomething}>
                    <div className={styles.flex}>
                        <div className={styles.mainContainer}>
                            <div className={styles.buttonCenter}>
                                <div className={styles.bubble}>
                                    USA Toner
                                </div>
                            </div>
                            <h1>
                                <div className={styles.homepageTitle}>
                                    Konica Minolta Cartridges
                                </div>
                            </h1>
                            <div className={moduleStyles.modelNavigation}>
                                <Link href="/konika" className={moduleStyles.backToModels}>
                                    &laquo; Back to All Models
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <section id={"toner"}></section>
                <div className={styles.center} style={{ flexDirection: 'column', alignItems: 'center', paddingTop: '30px' }}>
                    <h2 className={styles.sectionHeader} style={{ marginBottom: '10px' }}>Choose Model</h2>
                    <div className={moduleStyles.modelBox}>
                        <h3 className={moduleStyles.modelSubHeader}>BIZHUB {modelNumber || 'Model'}</h3>
                    </div>
                </div>

                <div className={moduleStyles.tabNavContainer}>
                    <div className={moduleStyles.tabNav}>
                        <button 
                            className={`${moduleStyles.tabButton} ${activeTab === 'toner' ? moduleStyles.activeTab : ''}`}
                            onClick={() => setActiveTab('toner')}
                        >
                            Toner
                        </button>
                        <button 
                            className={`${moduleStyles.tabButton} ${activeTab === 'waste' ? moduleStyles.activeTab : ''}`}
                            onClick={() => setActiveTab('waste')}
                        >
                            Waste Toner
                        </button>
                        <button 
                            className={`${moduleStyles.tabButton} ${activeTab === 'imaging' ? moduleStyles.activeTab : ''}`}
                            onClick={() => setActiveTab('imaging')}
                        >
                            Imaging Units
                        </button>
                        <button 
                            className={`${moduleStyles.tabButton} ${activeTab === 'all' ? moduleStyles.activeTab : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            All Supplies
                        </button>
                    </div>
                </div>

                <div className={styles.center}>
                    {isLoading ? (
                        <div className={moduleStyles.loaderContainer}>
                            <div className={moduleStyles.loader}></div>
                        </div>
                    ) : filterSuppliesByType().length > 0 ? (
                        <div className={styles.boxContainer}>
                            {filterSuppliesByType().map((item) => (
                                <div key={item.id || item.oemNos[0]?.oemNo} className={styles.box}>
                                    <Image
                                        alt={'image of supply item'}
                                        style={{ borderRadius: "5px" }}
                                        src={item.images && item.images[0] ? item.images[0] : "/static/toner-placeholder.webp"}
                                        width={180}
                                        height={180}
                                    />
                                    <div className={styles.titleSmallBlack}>{item.title}</div>
                                    <div style={{ width: "100%" }}>
                                        <div className={styles.row}>
                                            <div className={styles.row}>
                                                <div className={styles.centerFont}
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <div
                                                        style={{ paddingRight: "5px", color: "rgb(2,50,92)" }}
                                                        className={styles.price}
                                                    >
                                                        $
                                                    </div>
                                                    <div style={{ color: "rgb(2,50,92)" }} className={styles.modelSmallish}>
                                                        {item.serviceLevels[0].price}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.row}>
                                                <div
                                                    style={{ paddingRight: "5px" }}
                                                    className={styles.priceSmall}
                                                >
                                                    OEM:
                                                </div>
                                                <div className={styles.modelSmall}>{item.oemNos[0]?.oemNo}</div>
                                            </div>
                                        </div>
                                        <div style={{ paddingTop: "10px" }} className={styles.rowOem} />
                                    </div>
                                    <Link
                                        className={styles.somethingElse}
                                        href={`/tonerChoice?oem=${item.oemNos[0]?.oemNo}`}
                                    />
                                    <div style={{ width: "85%" }} className={styles.row}>
                                        <Link href={`/tonerChoice?oem=${item.oemNos[0]?.oemNo}`}>
                                            <button className={styles.buttonBlue}>See Details</button>
                                        </Link>
                                        <Link href={'/carts'}>
                                            <button 
                                                style={{ backgroundColor: "rgb(131,208,130)" }} 
                                                className={styles.buttonBlue} 
                                                onClick={() => {
                                                    const updatedCart = [
                                                        ...cart,
                                                        {
                                                            name: item.title,
                                                            oem: item.oemNos[0]?.oemNo,
                                                            price: item.serviceLevels[0].price,
                                                            quantity: 1,
                                                            image: item.images && item.images[0] ? item.images[0] : "/static/toner-placeholder.webp",
                                                        },
                                                    ];
                                                    setCart(updatedCart);
                                                }}
                                            >
                                                Add to cart
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={moduleStyles.emptyProductsContainer}>
                            <div className={moduleStyles.nothing}>
                                No {activeTab !== 'all' ? activeTab : 'supplies'} found for this model
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ModelSupplies; 