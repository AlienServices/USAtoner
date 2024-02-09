"use client"
import React, { useState, useRef, useContext, useEffect, useDebugValue } from "react";
import Head from "next/head";
import Image from "next/image";
import { Audio } from 'react-loader-spinner'
import Header from "../components/Header";
// import BestSellers from "./components/BestSellers";
import Link from "next/link";
import styles from "../page.module.css";
import { CartContext } from "../providers/cart/index";
import Footer from "../components/Footer";
import { useRouter } from "next/navigation";
export default function Data() {

  const [name, setName] = useState("");
  const { cart, setCart, cartLook, setRealPrice, tonerOem } = useContext(CartContext);
  const [recaptchaResponse, setRecaptchaResponse] = useState(false);
  const [inputData, setInputData] = useState()
  const [number, setNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState("");
  const [token, setToken] = useState();
  const [searchResult, setSearchResult] = useState();
  const [message, setMessage] = useState("this is the test message");
  const tawkMessengerRef = useRef();
  const captchaRef = useRef(null);
  const [toner, setToner] = useState()
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


  async function search() {
    setProducts()
    const aToken = JSON.parse(localStorage.getItem("token"))
    const requestOptions = {
      method: "POST",

      body:
        JSON.stringify({
          token: aToken.accessToken,
          search: inputData
        })

    }
    try {
      const response = await fetch('/api/products', requestOptions);
      const data1 = await response.json();
      setSearchResult(data1.cancel.products)            
      setSearching(true)
    } catch (err) {
    }
  }

  async function getProducts() {
    const aToken = JSON.parse(localStorage.getItem("token"))
    console.log(aToken, "this is a token we need")
    // aToken = localStorage.getItem("token")

    const requestOptions = {
      method: "POST",
      body: JSON.stringify({ token: aToken.accessToken, search: "dell" })

    }
    try {
      const response = await fetch('/api/products', requestOptions);
      const data1 = await response.json();
      console.log(data1, "this is data1")
      console.log(data1.cancel.products, "this is the product response")
      setSearching(true)
      localStorage.setItem("dell", JSON.stringify(data1.cancel.products))
      setProducts(data1.cancel.products)
    } catch (err) {
    }
  }

  useEffect(() => {
    getProducts()
  }, [token])

  useEffect(() => {
    if (localStorage.getItem("dell")) {
      setToner(JSON.parse(localStorage.getItem("dell")))
      setSearching(true)
    }
  }, [searching])

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
                  Dell Toner Cartridges
                </div>
              </h1>
              <input onChange={(event) => {
                setInputData(event.target.value)
              }} onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearching(!searching)
                  window.location.replace('#toner')
                  search()

                }

              }} className={styles.search} placeholder="Shop by OEM, Brand, or Model"></input>
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

        <section id={"toner"}></section>
        <div className={styles.center}>
          {searching ? <>
            {toner?.length > 0 ? <div className={styles.boxContainer}>
              {searchResult?.length >= 1 ? <>{searchResult?.slice(0, 24)?.map((toner) => {
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
                          <div className={styles.modelSmall}>{toner.oemNos[0]?.oemNo}</div>
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
                      <Link href={`/tonerChoice?oem=${toner.oemNos[0].oemNo}`}>
                        <button className={styles.buttonBlue} onClick={() => {
                        }}>See Details</button>
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
              })}</> : <>{toner?.slice(0, 24)?.map((toner) => {
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
                          <div className={styles.modelSmall}>{toner.oemNos[0]?.oemNo}</div>
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
                      <Link href={`/tonerChoice?oem=${toner.oemNos[0].oemNo}`}>
                        <button className={styles.buttonBlue} onClick={() => {
                        }}>See Details</button>
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
              })}</>}
            </div> : <div>
              <div className={styles.nothing}>No Products Found, Search Something Else</div>
            </div>}
          </> : <div className={''}><Audio
            height="150"
            width="100"
            radius="10"
            color="rgb(47,51,63)"
            ariaLabel="loading"
            wrapperStyle
            wrapperClass
          /></div>}
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
