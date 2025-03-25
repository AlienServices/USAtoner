"use client";
import React, { useEffect, useRef, useState, useContext } from "react";
import Header from "../components/Header";
import Image from "next/image";
import styles from "../styles/fileChoice.module.css";
// import { TonerContext } from "../toner/index";
import Footer from "../components/Footer";
import Link from "next/link";
import { CartContext } from "../providers/cart";
import { Suspense } from 'react'
import { useSearchParams } from "next/navigation";
// export const dynamic = "force-dynamic"
// import BreadCrumbs from "../components/BreadCrumbs";

const TonerChoice = (props) => {
    const searchParams = useSearchParams();
    const oem = searchParams.get("oem");
    const [recaptchaResponse, setRecaptchaResponse] = useState(false);
    const { cart, setCart, cartLook, setRealPrice, tonerOem } = useContext(CartContext);
    const [aboveOne, setAboveOne] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [toner, setToner] = useState([]);
    const [name, setName] = useState("");
    const [cartAccess, setCartAccess] = useState(true);
    const [email, setEmail] = useState("");
    const [number, setNumber] = useState("");
    const [message, setMessage] = useState("");
    const [orderId, setOrderId] = useState("");
    const [newPrice, setNewPrice] = useState();
    const [token, setToken] = useState();

    const tawkMessengerRef = useRef();

    // useEffect(() => {
    //     cart.map((item) => {
    //         if (item.oem === toner.oem) {
    //             setCartAccess(false);
    //         }
    //     });
    // }, [toner.oem, cart]);

    // useEffect(() => {
    //     if (quantity > 1) {
    //         setAboveOne(true);
    //         setNewPrice(toner.price * quantity);
    //     } else {
    //         setAboveOne(false);
    //     }
    // }, [quantity, toner.price]);

    useEffect(() => { });
    const sendSuccessEmail = (e) => {
        e.preventDefault();
        fetch("https://api.smtp2go.com/v3/email/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: "api-A4D77AA0362911EEA716F23C91C88F4E",
                to: [`<info@copiersutah.com>`],
                sender: "<info@copiersutah.com>",
                subject: `This is${name}'s quote form. Her number is ${number}`,
                text_body: `${message}`,
                html_body: `<h1>${message}</h1>`,
                template_id: "0107239",
                template_data: {
                    ID: orderId,
                    number: number,
                    toner: tonerName,
                    name: name,
                    email: email,
                },
            }), //
        }).then((res) => {
            if (res.status === 200) {
                console.log("Response succeeded!");
                // setSubmitted(true);
                // setName("");
                // setEmail("");
                // setBody("");
            }
        });
    };

    var verifyCallback = function (response) {
        setRecaptchaResponse(response);
    };

    const handleMinimize = () => {
        tawkMessengerRef.current.minimize();
    };

    async function getProducts() {  
        try {
            // First try to get from Clover
            const tokenStr = localStorage.getItem("token");
            if (!tokenStr) {
                console.log("No token found in localStorage, skipping Clover search");
                // Skip Clover search and go straight to ITC
            } else {
                const aToken = JSON.parse(tokenStr);          
                const requestOptions = {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        token: aToken?.accessToken,
                        search: `${oem}`
                    })
                }
                
                const response = await fetch('/api/products', requestOptions);
                const data1 = await response.json();
                
                if (data1?.cancel?.products?.length > 0) {
                    setToner(data1.cancel.products);
                    return;
                }
            }

            // If no Clover results or no token, try ITC inventory
            const itcResponse = await fetch('/api/inventory');
            const itcData = await itcResponse.json();
            
            const itcProduct = itcData.data.find(item => 
                item.sku === oem || 
                item.mfgPartNumber === oem
            );

            if (itcProduct) {
                // Transform ITC product to match expected structure
                const transformedProduct = {
                    id: itcProduct.sku,
                    title: itcProduct.description || 'ITC Product',
                    price: itcProduct.price,
                    images: ['/static/placeholder.svg'],
                    description: itcProduct.description || '',
                    category: 'ITC',
                    quantity: itcProduct.quantity || 0,
                    itcProduct: true,
                    oemNos: [{
                        oemNo: itcProduct.mfgPartNumber || itcProduct.sku
                    }],
                    serviceLevels: [{
                        price: itcProduct.price
                    }],
                    manufacturerName: itcProduct.manufacturerName || getBrandFromSKU(itcProduct.sku),
                    // Add default values for missing fields
                    yield: 'N/A',
                    productBoxDimensions: {
                        weight: 'N/A'
                    }
                };
                setToner([transformedProduct]);
            }
        } catch (err) {
            console.error('Error fetching products:', err);
        }
    }

    // Helper function to detect brand from SKU
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
        getProducts()        
    }, [oem])

    console.log(toner, "this is what were seeing")
    return (
        <div className={styles.main}>

            <Header />
            <div className={styles.mainContent}>
                <div className={styles.center}>
                    <div className={styles.column}>

                        <div className={styles.titleSmall}> OEM #: {toner[0]?.oemNos?.[0]?.oemNo || oem}</div>
                        <div className={styles.imageContainer}>
                            <Image 
                                src={toner[0]?.images?.[0] || '/static/placeholder.svg'} 
                                width={300} 
                                height={250} 
                                alt={`Image of ${toner[0]?.title || 'toner cartridge'}`}
                                priority
                            />
                        </div>
                    </div>
                    <div className={styles.centerFeature}>
                        <div className={styles.aContainer}>
                            <div className={styles.titleLarge}>{toner[0]?.title}</div>
                            <div className={styles.something}>
                                <div className={styles.titleSmall}>
                                    <div className={styles.small}>
                                        ${aboveOne ? newPrice : (toner[0]?.serviceLevels?.[0]?.price || toner[0]?.price)}
                                    </div>
                                </div>
                                <div className={styles.line}></div>
                                <div style={{ color: "black" }}>Features:</div>
                                <div className={styles.flex}>
                                    <div className={styles.detailColumn}>
                                        <div className={styles.titleSmall}>
                                            Model: <div className={styles.small}>{oem}</div>{" "}
                                        </div>
                                        <div className={styles.titleSmall}>
                                            Yield: <div className={styles.small}>{toner[0]?.yield || 'N/A'}</div>{" "}
                                        </div>
                                    </div>
                                    <div className={styles.detailColumn}>
                                        <div className={styles.titleSmall}>
                                            Shipping Weight: {" "}<div className={styles.titleSmall}>{toner[0]?.productBoxDimensions?.weight || 'N/A'}</div>
                                        </div>

                                        <div className={styles.titleSmall}>
                                            Condition: <div className={styles.small}>New</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.line}></div>
                        </div>
                        <div style={{ paddingTop: "10px", marginBottom: "10px", paddingBottom: "20px", display: "flex", width: "35%", paddingRight: "10px" }} className={styles.titleSmall}>
                            Qty
                            <div className={styles.centerBottom}>
                                <div className={styles.centerPlus}>
                                    <div onClick={() => {
                                        setQuantity(quantity + 1)
                                    }} className={styles.plus}>+</div>
                                </div>
                                <input style={{ textAlign: "center" }}
                                    onChange={(event) => {
                                        setQuantity(event.target.value);
                                    }}
                                    className={styles.number}
                                    placeholder={quantity}
                                    type="number"
                                />
                                <div className={styles.centerPlus}>
                                    <div onClick={() => {
                                        if (quantity > 1) {
                                            setQuantity(quantity - 1)
                                        }
                                    }} className={styles.minus}>-</div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.buttonRow}>
                            <button
                                className={styles.buttonBlue}
                                onClick={(e) => {
                                    getOrderData().then(() => {
                                        setOrderData().then(() => {
                                            sendSuccessEmail(e);
                                            createDistribution();
                                        });
                                    });
                                    setOrderData();
                                }}
                            >
                                Buy Now
                            </button>
                            <Link href={"/carts"}>
                                <button className={styles.button3}>
                                    {cartAccess ? (
                                        <div
                                            onClick={() => {
                                                const updatedCart = [
                                                    ...cart,
                                                    {
                                                        name: toner[0]?.title,
                                                        oem: toner[0]?.oemNos?.[0]?.oemNo || oem,
                                                        price: toner[0]?.serviceLevels?.[0]?.price || toner[0]?.price,
                                                        quantity: quantity,
                                                        image: toner[0]?.images?.[0] || '/static/placeholder.svg',
                                                    },
                                                ];
                                                setCart(updatedCart);
                                            }}
                                        >
                                            Add To Cart
                                        </div>
                                    ) : (
                                        <div>Already Added</div>
                                    )}
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />

        </div>
    );
};

export default TonerChoice;

