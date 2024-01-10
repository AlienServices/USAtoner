"use client"
import React, { useState, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
import Header from "../components/Header";
import BestSellers from "../components/BestSellers";
import AllOptions from "../components/AllOptions";
import Link from "next/link";
import styles from "../page.module.css";
import Footer from "../components/Footer";
import { useRouter } from "next/navigation";

export default function Data() {
    const [name, setName] = useState("");
    const [recaptchaResponse, setRecaptchaResponse] = useState(false);
    const [email, setEmail] = useState("");
    const [number, setNumber] = useState("");
    const [message, setMessage] = useState("this is the test message");
    const tawkMessengerRef = useRef();
    const captchaRef = useRef(null);
    const onLoad = () => {
        console.log("onLoad works!");
    };
    const handleMinimize = () => {
        tawkMessengerRef.current.minimize();
    };
    const router = useRouter();
    var verifyCallback = function (response) {
        setRecaptchaResponse(response);
    };

    // async function getProducts() {

    //     const requestOptions = {
    //       method: "POST",
    
    //       body:
    //         JSON.stringify({
    //           token: token.accessToken,
    //           search: "Lexmark"
    //         })
    
    //     }
    //     try {
    
    //       const response = await fetch('/api/products', requestOptions);
    //       const data1 = await response.json();
    //       console.log(data1.cancel.products, "this is the product response")
    //       setProducts(data1.cancel.products)
    //     } catch (err) {
    //     }
    //   }

    const sendEmail = (e) => {
        e.preventDefault();
        console.log("Sending");

        fetch("https://api.smtp2go.com/v3/email/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: "api-DC44EBDEE45411ED847EF23C91C88F4E",
                to: [`<info@copiersutah.com>`],
                sender: "<info@copiersutah.com>",
                subject: `This is${name}'s quote form. Their number is ${number}`,
                text_body: `${message}`,
                html_body: `<h1>${message}</h1>`,
                template_id: "5120871",
                template_data: {
                    message: message,
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
                                    Lexmark Toner Cartridges
                                </div>
                            </h1>
                            <div className={styles.paragraphSmall}>
                                We provide the highest quality Lexmark Toner cartidges
                            </div>
                            <div className={styles.buttonCenter}>
                                <Link href={'/buy'}>
                                    <button className={styles.buttonBlue}>Get A Quote Now</button>
                                </Link>
                            </div>
                        </div>

                        <div className={styles.displayNone}>
                            <Image
                                src="/static/Group.webp"
                                alt="buy a used or new business copier"
                                width={500}
                                height={300}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.lineContainer}>
                    <div className={styles.line}></div>
                </div>
                <div className={styles.center}>
                    <BestSellers />
                    <div className={styles.boxContainer}>
                        {toners.slice(0, 7).map((toner) => {
                            return (

                                <div
                                    key={toner.oem}
                                    // onClick={() => {
                                    //   setCartLook({
                                    //     name: toner.name,
                                    //     oem: toner.oem,
                                    //     price: toner.price,
                                    //     color: toner.color,
                                    //     photo: toner.image,
                                    //     yield: toner.yield,
                                    //   });
                                    // }}
                                    className={styles.box}
                                >

                                    <Link
                                        onClick={() => {
                                            setTonerOem(toner.oem)
                                            localStorage.setItem("tonerOem", toner.oem)

                                        }}
                                        className={styles.somethingElse}
                                        href={`/tonerChoice?oem=${toner.oem}`}
                                    >
                                        <Image
                                            style={{ borderRadius: "5px" }}
                                            src={toner.image}
                                            width={180}
                                            height={180}
                                        ></Image>
                                        <div className={styles.titleSmallBlack}>{toner.name}</div>
                                        <div style={{ width: "100%" }}>
                                            <div style={{ paddingRight: "15px" }} className={styles.row}>
                                                <div className={styles.row}>
                                                    <div
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
                                                            {toner.price}
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
                                                    <div className={styles.modelSmall}>{toner.oem}</div>
                                                </div>
                                            </div>
                                            <div
                                                style={{ paddingTop: "10px" }}
                                                className={styles.rowOem}
                                            >
                                                <div
                                                    style={{ paddingRight: "8px", paddingBottom: "5px" }}
                                                    className={styles.priceMedium}
                                                >
                                                    Models:
                                                </div>
                                                <div className={styles.modelSmall}>{toner.models}</div>

                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <AllOptions />
            </div >
            <Footer />
        </div >
    );
}
