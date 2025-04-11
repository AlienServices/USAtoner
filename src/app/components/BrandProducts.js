import React, { useState, useEffect, useContext } from 'react';
import { CartContext } from "../providers/cart";
import Image from "next/image";
import Link from "next/link";
import styles from "../page.module.css";
import { Audio } from 'react-loader-spinner';

export default function BrandProducts({ brandName }) {
    const { token, cart, setCart } = useContext(CartContext);
    const [products, setProducts] = useState([]);
    const [searching, setSearching] = useState(false);
    const [toner, setToner] = useState();

    async function getBrandProducts() {
        try {
            // Fetch Clover Imaging products
            const responseClover = await fetch('/api/products', {
                method: 'POST',
                body: JSON.stringify({ 
                    token: token, 
                    search: brandName 
                })
            });
            const dataClover = await responseClover.json();

            // Fetch ITC inventory
            const responseITC = await fetch('/api/inventory');
            const dataITC = await responseITC.json();

            // Transform and filter ITC products
            const transformedITCProducts = dataITC.data
                .filter(item => {
                    const itemBrand = item.manufacturerName || getBrandFromSKU(item.sku);
                    return itemBrand.toLowerCase() === brandName.toLowerCase();
                })
                .map(item => ({
                    id: item.sku,
                    title: item.description || 'ITC Product',
                    price: item.price,
                    images: ['/static/placeholder.svg'],
                    description: item.description || '',
                    category: 'ITC',
                    quantity: item.quantity || 0,
                    itcProduct: true,
                    oemNos: [{
                        oemNo: item.mfgPartNumber || item.sku
                    }],
                    serviceLevels: [{
                        price: item.price
                    }],
                    manufacturerName: item.manufacturerName || getBrandFromSKU(item.sku)
                }));

            // Combine and filter Clover products
            const cloverProducts = dataClover.cancel.products.filter(product => 
                product.manufacturerName?.toLowerCase().includes(brandName.toLowerCase()) ||
                product.title?.toLowerCase().includes(brandName.toLowerCase())
            );

            // Combine both inventories
            const combinedProducts = [...cloverProducts, ...transformedITCProducts];
            
            setSearching(true);
            localStorage.setItem(`${brandName.toLowerCase()}_products`, JSON.stringify(combinedProducts));
            setProducts(combinedProducts);
            setToner(combinedProducts);
        } catch (err) {
            console.error(`Error fetching ${brandName} products:`, err);
            // Try to load cached products
            const cachedProducts = localStorage.getItem(`${brandName.toLowerCase()}_products`);
            if (cachedProducts) {
                setSearching(true);
                setToner(JSON.parse(cachedProducts));
            }
        }
    }

    function getBrandFromSKU(sku) {
        const skuLower = sku.toLowerCase();
        if (skuLower.includes('br')) return 'Brother';
        if (skuLower.includes('hp')) return 'HP';
        if (skuLower.includes('lex')) return 'Lexmark';
        if (skuLower.includes('xer')) return 'Xerox';
        if (skuLower.includes('dell')) return 'Dell';
        if (skuLower.includes('kon')) return 'Konica';
        return 'Other';
    }

    useEffect(() => {
        getBrandProducts();
    }, [token, brandName]);

    return (
        <div className={styles.center}>
            <h1 className={styles.brandTitle}>{brandName} Toner Cartridges</h1>
            {searching ? (
                <>
                    {toner?.length > 0 ? (
                        <div className={styles.boxContainer}>
                            {toner.map((toner) => (
                                <div key={toner.id || toner.sku} className={styles.box}>
                                    <Image
                                        alt={'image of toner'}
                                        style={{ borderRadius: "5px" }}
                                        src={toner.images?.[0] || '/static/placeholder.svg'}
                                        width={180}
                                        height={180}
                                    />
                                    <div className={styles.titleSmallBlack}>{toner.title}</div>
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
                                                    <div className={styles.price} style={{ paddingRight: "5px", color: "rgb(2,50,92)" }}>
                                                        $
                                                    </div>
                                                    <div className={styles.modelSmallish} style={{ color: "rgb(2,50,92)" }}>
                                                        {toner.serviceLevels?.[0]?.price || toner.price}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.row}>
                                                <div className={styles.priceSmall} style={{ paddingRight: "5px" }}>
                                                    OEM:
                                                </div>
                                                <div className={styles.modelSmall}>
                                                    {toner.oemNos?.[0]?.oemNo || toner.mfgPartNumber || toner.sku}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ width: "85%" }} className={styles.row}>
                                        <Link href={`/tonerChoice?oem=${toner.oemNos?.[0]?.oemNo || toner.mfgPartNumber || toner.sku}`}>
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
                                                            name: toner.title,
                                                            oem: toner.oemNos?.[0]?.oemNo || toner.mfgPartNumber || toner.sku,
                                                            price: toner.serviceLevels?.[0]?.price || toner.price,
                                                            quantity: 1,
                                                            image: toner.images?.[0] || '/static/placeholder.svg',
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
                        <div className={styles.nothing}>No {brandName} Products Found</div>
                    )}
                </>
            ) : (
                <div className={''}>
                    <Audio
                        height="150"
                        width="100"
                        radius="10"
                        color="rgb(47,51,63)"
                        ariaLabel="loading"
                        wrapperStyle
                        wrapperClass
                    />
                </div>
            )}
        </div>
    );
} 