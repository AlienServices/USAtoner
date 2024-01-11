"use client"
import React, { useState, useRef, useContext, useEffect, useDebugValue } from "react";
import Head from "next/head";
import Image from "next/image";
import Header from "./components/Header";
import BestSellers from "./components/BestSellers";
import Link from "next/link";
import styles from "./page.module.css";
import { CartContext } from "../app/providers/cart";
import Footer from "./components/Footer";
import { useRouter } from "next/navigation";
export default function Data() {

  const [name, setName] = useState("");
  const { cart, setCart, cartLook, setRealPrice, tonerOem } = useContext(CartContext);
  const [recaptchaResponse, setRecaptchaResponse] = useState(false);
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [products, setProducts] = useState("");
  const [token, setToken] = useState();
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


  async function getToken() {
    const requestOptions = {
      method: "POST",
    }
    try {
      const response = await fetch('/api/email', requestOptions);
      const data1 = await response.json();
      console.log(data1.cancel, "this is the response")
      
      localStorage.setItem("token", JSON.stringify(data1.cancel))
    } catch (err) {
    }
  }


  // async function test() {
  //   const requestOptions = {
  //     method: "GET",
  //   }
  //   try {
  //     const response = await fetch('/api/models', requestOptions);
  //     const data1 = await response.json();
  //     console.log(data1.cancel, "this is the response")            
  //   } catch (err) {
  //   }
  // }


  // async function getProducts() {
  //   const requestOptions = {
  //     method: "POST",
  //     body:  JSON.stringify({ token: token.accessToken, search: "" }) 

  //   }
  //   try {
  //     const response = await fetch('/api/products', requestOptions);
  //     const data1 = await response.json();
  //     console.log(data1, "this is data1")
  //     console.log(data1.cancel.products, "this is the product response")
  //     setProducts(data1.cancel.products)
  //   } catch (err) {
  //   }
  // }
  // useEffect(() => {
  //   if (token?.cancel?.accessToken === undefined) {
  //     getToken()
  //   } else if (token?.cancel?.loginStatus) {
  //     getToken()
  //   }
  // }, [])

  // useEffect(() => {
  //   if (token?.accessToken) {
  //     getProducts()
  //   }
  // }, [token])








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
                  Shop from our American Made toners
                </div>
              </h1>
              <div className={styles.paragraphSmall}>
                We provide a variety of high-quality american made toners for your business needs at an affordable price.
              </div>
              <div className={styles.buttonCenter}>
                <Link href={'/contact'}>
                  <button className={styles.buttonBlue}>Get A Quote Now</button>
                  <button onClick={() => {
                    getToken()
                  }} className={styles.buttonBlue}>Testing</button>
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
            {products && <>

              {products?.map((toner) => {
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

                    <Image
                      alt={'image of toner'}
                      style={{ borderRadius: "5px" }}
                      src={toner.images[0]}
                      width={180}
                      height={180}
                    ></Image>
                    <div className={styles.titleSmallBlack}>{toner.title}</div>
                    <div style={{ width: "100%" }}>
                      <div className={styles.row}>
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
                              {toner.serviceLevels[0].price}
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
                          <div className={styles.modelSmall}>{toner.oemNos[0].oemNo}</div>
                        </div>
                      </div>
                      <div
                        style={{ paddingTop: "10px" }}
                        className={styles.rowOem}
                      >
                      </div>
                    </div>
                    <Link
                      onClick={() => {
                        setTonerOem(toner.oem)
                        localStorage.setItem("tonerOem", toner.oem)

                      }}
                      className={styles.somethingElse}
                      href={`/tonerChoice?oem=${toner.oem}`}
                    ></Link>
                    <div style={{ width: "85%" }} className={styles.row}>
                      <Link href={'/carts'}>
                        <button className={styles.buttonBlue} onClick={() => {
                          const updatedCart = [
                            ...cart,
                            {
                              name: toner.title,
                              oem: toner.oemNos[0].oemNo,
                              price: toner.serviceLevels[0].price,
                              quantity: 1,
                              image: toner.images[0],
                            },
                          ];
                          setCart(updatedCart)
                        }}>Add to cart</button>
                      </Link>
                      <Link href={'/carts'}>
                        <button style={{ backgroundColor: "rgb(131,208,130)" }} className={styles.buttonBlue} onClick={() => {
                          const updatedCart = [
                            ...cart,
                            {
                              name: toner.title,
                              oem: toner.oemNos[0].oemNo,
                              price: toner.serviceLevels[0].price,
                              quantity: 1,
                              image: toner.images[0],
                            },
                          ];
                          setCart(updatedCart)
                        }}>Add to cart</button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </>}

          </div>
        </div>
        <div className={styles.reviewSection}>
          <div className={styles.customerTitle} >Trusted by hundreds of <div className={styles.blueSmall}>happy customers</div></div>
          <div className={styles.rowSpaced}>
            <div className={styles.boxReview}>
              <div className={styles.starRow}>
                <div className={styles.titleSmall}>Tara Bennets</div>
                <div className={styles.flexCenter}>
                  <div>5.0</div>
                  <Image
                    src="/static/star.webp"
                    alt="buy a used or new business copier"
                    width={20}
                    height={20}
                  />
                </div>
              </div>
              <div className={styles.paragraphReview}>These guys do not disappoint! I have done business with them for a few years now. They have great customer service and amazing pricing on copy machines!</div>
            </div>
            <div className={`${styles.boxReview} ${styles.hideBox}`}>
              <div className={styles.starRow}>
                <div className={styles.titleSmall}>Kyle Francis</div>
                <div className={styles.flexCenter}>
                  <div>5.0</div>
                  <Image
                    src="/static/star.webp"
                    alt="buy a used or new business copier"
                    width={20}
                    height={20}
                  />
                </div>
              </div>
              <div className={styles.paragraphReview}>Great company to work with. They have friendly staff and were able to get me up and running within a few days.
              </div>
            </div>
            <div className={styles.boxReview}>
              <div className={styles.starRow}>
                <div className={styles.titleSmall}>Carley Ward</div>
                <div className={styles.flexCenter}>
                  <div>5.0</div>
                  <Image
                    src="/static/star.webp"
                    alt="buy a used or new business copier"
                    width={20}
                    height={20}
                  />
                </div>
              </div>
              <div className={styles.paragraphReview}>This company is the best to do work with. They are very friendly and very helpful. I will be recommending them to everyone. I will never go anywhere else!</div>
            </div>
          </div>
          <div>
            <Link href={'https://www.google.com/maps/place/Copiers+for+Less/@40.599545,-111.9091041,17z/data=!4m8!3m7!1s0x87528bb3da9348f5:0x52af9011e571a1bf!8m2!3d40.599545!4d-111.9065292!9m1!1b1!16s%2Fg%2F1hc90lr04?entry=ttu'} target={'_blank'}>
              <button className={styles.buttonBlue}>See All Google Reviews</button>
            </Link>
          </div>
        </div>
      </div >
      <Footer />
    </div >
  );
}

// import Toners from "./api/models/Toners"
// (async () => {
//   try{
//     await Toners.create({name: "kale", email: "gmail.com"})
//     await Toners.create({name: "jason", email: "j@gmail.com"})
//     const toners = await Toner.findAll()
//     console.log(toners, "these is tonersss")
//   } catch(err){
//     console.log(err)
//   }
// })
