"use client";
import React, { useEffect, useRef, useState, useContext } from "react";
import Header from "../components/Header";
import Image from "next/image";
import Head from "next/head";
import styles from "../styles/cart.module.css";
import Link from "next/link";
// import BreadCrumbs from "../components/BreadCrumbs";
import { CartContext } from "../providers/cart";
import Footer from "../components/Footer";
// import TawkMessengerReact from "@tawk.to/tawk-messenger-react";

const Cart = () => {
    const [recaptchaResponse, setRecaptchaResponse] = useState(false);
    const [name, setName] = useState("");
    const [orderId, setOrderId] = useState("");
    const { cart, setCart, cartLook, setRealPrice, tonerOem } = useContext(CartContext);
    const [noChange, setFalse] = useState(false);
    const [something, setSomething] = useState(false);
    const [price, setPrice] = useState("");
    const [total, setTotal] = useState(0);
    const [newPrice, setNewPrice] = useState("");
    const [number, setNumber] = useState("");
    const [message, setMessage] = useState("");
    const tawkMessengerRef = useRef();

    async function createLink() {
        const response = await fetch("/api/pay", { method: "POST" });
        const data = await response.json();
        window.location.replace(data.redirect);
    }


    const sendEmail = (e) => {
        e.preventDefault();
        console.log("Sending");

        fetch("https://api.smtp2go.com/v3/email/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: "''",
                to: [`<info@copiersutah.com>`],
                sender: "<info@copiersutah.com>",
                subject: `This is${name}'s quote form. Her number is ${number}`,
                text_body: `${message}`,
                html_body: `<h1>${message}</h1>`,
                template_id: "5120871",
                template_data: {
                    message: message,
                    from: "buy a copier",
                    number: number,
                    name: name,
                },
            }),
        }).then((res) => {
            console.log(res);
            if (res.status === 200) {
                console.log("Response succeeded!");
                // setSubmitted(true);
                // setName("");
                // setEmail("");
                // setBody("");
            }
        });
    };
    var removeCartItem = function (id) {
        setCart(cart.splice(id, 1));
    };

    var verifyCallback = function (response) {
        setRecaptchaResponse(response);
    };

    const handleMinimize = () => {
        tawkMessengerRef.current.minimize();
    };
    const onLoad = () => {
        console.log("onLoad works!");
    };
    const newPriceAction = function () {
        let arr = [0]

        cart.map((item) => {
            arr.push(item.quantity * item.price)

        })
        let result = arr?.reduce((acc, item) => {
            return acc + item
        })
        let addedResult = result + 2.99
        setTotal(addedResult.toFixed(2))

    }
    useEffect(() => {
        newPriceAction()
    }, [cart])

    const decimal = function (item) {
        setRealPrice(item.toFixed(2))
        return item.toFixed(2)
    }
    // useEffect(() => {
    //     newPriceAction()
    // }, [cart])

    const breadCrumbs = [
        { name: "Home", url: "/" },
        { name: `Toners`, url: `/toner` },
        // { name: `${tonerOem}`, url: `/tonerChoice?oem=${tonerOem}` }
    ]

    console.log(cart, "this is cart")

    return (
        <div className={styles.main}>

            <div>
                {/* <TawkMessengerReact
                    onLoad={onLoad}
                    propertyId="5abd4931d7591465c7090c65"
                    widgetId="default"
                    useRef={tawkMessengerRef}
                /> */}
            </div>
            <Header />
            {/* <BreadCrumbs breadCrumbs={breadCrumbs} /> */}
            <div className={styles.bottomMain}>
                <div className={styles.hundred}>
                    <div className={styles.mainTitleBig}>Your Shopping Cart</div>
                    {cart.length === 0 ? (
                        <div style={{ color: "black", textAlign: "center", paddingTop: "25px" }}>Your cart is empty</div>
                    ) : (
                        <div style={{ color: "black" }}></div>
                    )}
                    {cart?.map((toner, index) => {
                        return (
                            <div key={index} className={styles.thirdSection}>
                                <div className={styles.buggyContainer}>
                                    <div
                                        style={{ color: "black", cursor: "pointer", textAlign: "end", width: "93%" }}
                                        onClick={() => {
                                            setCart(cart.filter((t) => t.oem !== toner.oem));
                                        }}
                                    >
                                        X
                                    </div>
                                    <div className={styles.buggy}>
                                        <div className={styles.left} style={{ width: "200px" }}>
                                            <Image alt={"image of toner"} src={toner.image} width={150} height={150} />
                                        </div>
                                        <div className={styles.priceBox}>
                                            <div className={styles.cartTitle}>{toner.name}</div>
                                            <div
                                                className={styles.oemContainer}
                                            >
                                                <div
                                                    style={{
                                                        color: "black",
                                                        fontSize: "23px",
                                                        fontWeight: "500",
                                                        paddingRight: "8px",
                                                    }}
                                                >
                                                    OEM:
                                                </div>
                                                <div className={styles.OemMobile}>
                                                    {toner.oem}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.cartRow}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: "100px"
                                                }}
                                            >
                                                <div
                                                    onClick={() => {
                                                        setTotal(0)
                                                        setCart(

                                                            cart.map((t) => {
                                                                if (t.oem === toner.oem && t.quantity >= 1) {
                                                                    return {
                                                                        ...t,
                                                                        quantity: t.quantity - 1,
                                                                    };
                                                                }
                                                                return t;
                                                            })
                                                        );
                                                    }}
                                                    className={styles.plusButton}
                                                    style={{
                                                        color: "black",
                                                        fontSize: "23px",
                                                        fontWeight: "300",
                                                    }}
                                                >
                                                    -
                                                </div>
                                                <div className={styles.quantity}>
                                                    {toner.quantity}
                                                </div>
                                                <div style={{ color: "black", cursor: "pointer" }}
                                                    onClick={() => {
                                                        setTotal(0)
                                                        setCart(

                                                            cart.map((t) => {
                                                                if (t.oem === toner.oem) {
                                                                    return {
                                                                        ...t,
                                                                        quantity: t.quantity + 1,
                                                                    };
                                                                }
                                                                return t;
                                                            })
                                                        );
                                                    }}
                                                    className={styles.plusButton}>

                                                    +

                                                </div>
                                            </div>
                                            <div className={styles.removeBox}>

                                                <div className={styles.priceRight}>
                                                    ${decimal(toner.price * toner.quantity)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.line}></div>
                            </div>
                        );
                    })}
                </div>
                <div className={styles.boxContainer}>
                    <div className={styles.box}>
                        <div className={styles.title}>Total</div>
                        <div>
                            <div style={{ display: "flex", width: "200px", padding: "10px", fontSize: "20px", alignItems: "center" }}>
                                <div style={{ fontSize: "20px", width: "150px" }}>Delivery:</div>
                                <div style={{ width: "100px", fontSize: "15px" }} >$2.99</div>
                            </div>
                            <div style={{ display: "flex", padding: "10px", width: "200px", alignItems: "center" }}>
                                <div style={{ paddingRight: "10px", fontSize: "20px", width: "150px" }}>Sub-Total:</div>
                                <div style={{ width: "100px", fontSize: "15px" }}>${total}</div>
                            </div>
                        </div>
                        <div className={styles.buttonContainterB}>
                            <Link href={'/'}>
                                <button style={{ height: "42px" }} onClick={() => { }} className={styles.buttonCheck}>

                                    Add More Items
                                </button>
                            </Link>
                            <Link href={'/checkout'}>
                                <button onClick={() => {
                                    localStorage.setItem("total", total)
                                }} style={{
                                    height: "42px"
                                }} className={styles.buttonCheckB}>
                                    Checkout
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

export default Cart;
