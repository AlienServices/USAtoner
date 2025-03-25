"use client"
import React, { useState, useRef, useContext, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import { Audio } from 'react-loader-spinner'
import Header from "../components/Header";
import Link from "next/link";
import styles from "../page.module.css";
import { CartContext } from "../providers/cart/index";
import Footer from "../components/Footer";
import { useRouter } from "next/navigation";

export default function Data() {
  const [name, setName] = useState("");
  const { cart, setCart, cartLook, setRealPrice, tonerOem, token } = useContext(CartContext);
  const [inputData, setInputData] = useState();
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState("");  
  const [searchResult, setSearchResult] = useState();
  const tawkMessengerRef = useRef();
  const [toner, setToner] = useState();
  const router = useRouter();

  async function search() {
    try {
      setProducts();
      const aToken = JSON.parse(localStorage.getItem("token"));
      if (!aToken?.accessToken) {
        console.error("No access token found");
        return;
      }
      const requestOptions = {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: aToken.accessToken,
          search: inputData
        })
      }
      const response = await fetch('/api/products', requestOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data1 = await response.json();
      setSearchResult(data1.cancel.products);            
      setSearching(true);
    } catch (err) {
      console.error("Error searching products:", err);
      setSearching(false);
    }
  }

  async function getProducts() {
    try {
      const aToken = JSON.parse(localStorage.getItem("token"));
      if (!aToken?.accessToken) {
        console.error("No access token found");
        return;
      }
      
      const requestOptions = {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: aToken.accessToken, 
          search: "hp" 
        })
      }

      const response = await fetch('/api/products', requestOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data1 = await response.json();
      if (!data1?.cancel?.products) {
        throw new Error("Invalid response format");
      }

      setSearching(true);
      localStorage.setItem("hp", JSON.stringify(data1.cancel.products));
      setProducts(data1.cancel.products);
    } catch (err) {
      console.error("Error fetching HP products:", err);
      setSearching(false);
      // Try to load cached products if available
      const cachedProducts = localStorage.getItem("hp");
      if (cachedProducts) {
        try {
          const parsedProducts = JSON.parse(cachedProducts);
          setToner(parsedProducts);
          setSearching(true);
        } catch (e) {
          console.error("Error loading cached products:", e);
        }
      }
    }
  }

  useEffect(() => {
    if (token) {
      getProducts();
    }
  }, [token]);

  useEffect(() => {
    if (localStorage.getItem("hp")) {
      setSearching(true);
      setToner(JSON.parse(localStorage.getItem("hp")));
    }
  }, [products]);

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
                  HP Toner Cartridges
                </div>
              </h1>
              <input 
                onChange={(event) => {
                  setInputData(event.target.value);
                }} 
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearching(!searching);
                    window.location.replace('#toner');
                    search();
                  }
                }} 
                className={styles.search} 
                placeholder="Search by OEM, Brand, or Model"
              />
            </div>
            <div className={styles.displayNone}>
              <Image
                src="/static/Group.webp"
                alt="HP toner cartridges"
                width={500}
                height={300}
              />
            </div>
          </div>
        </div>

        <section id="toner"></section>
        <div className={styles.center}>
          {searching ? (
            <>
              {toner?.length > 0 ? (
                <div className={styles.boxContainer}>
                  {searchResult?.length >= 1 ? (
                    <>
                      {searchResult?.slice(0, 24)?.map((toner) => (
                        <div key={toner.oem} className={styles.box}>
                          <Image
                            alt={'image of toner'}
                            style={{ borderRadius: "5px" }}
                            src={toner.images[0]}
                            width={180}
                            height={180}
                          />
                          <div className={styles.titleSmallBlack}>{toner.title}</div>
                          <div style={{ width: "100%" }}>
                            <div className={styles.row}>
                              <div className={styles.row}>
                                <div className={styles.centerFont}>
                                  <div style={{ paddingRight: "5px", color: "rgb(2,50,92)" }} className={styles.price}>
                                    $
                                  </div>
                                  <div style={{ color: "rgb(2,50,92)" }} className={styles.modelSmallish}>
                                    {toner.serviceLevels[0].price}
                                  </div>
                                </div>
                              </div>
                              <div className={styles.row}>
                                <div style={{ paddingRight: "5px" }} className={styles.priceSmall}>
                                  OEM:
                                </div>
                                <div className={styles.modelSmall}>{toner.oemNos[0]?.oemNo}</div>
                              </div>
                            </div>
                          </div>
                          <div style={{ width: "85%" }} className={styles.row}>
                            <Link href={`/tonerChoice?oem=${toner.oemNos[0].oemNo}`}>
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
                                      oem: toner.oemNos[0].oemNo,
                                      price: toner.serviceLevels[0].price,
                                      quantity: 1,
                                      image: toner.images[0],
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
                    </>
                  ) : (
                    <div className={styles.boxContainer}>
                      {toner?.slice(0, 24)?.map((toner) => (
                        <div key={toner.oem} className={styles.box}>
                          <Image
                            alt={'image of toner'}
                            style={{ borderRadius: "5px" }}
                            src={toner.images[0]}
                            width={180}
                            height={180}
                          />
                          <div className={styles.titleSmallBlack}>{toner.title}</div>
                          <div style={{ width: "100%" }}>
                            <div className={styles.row}>
                              <div className={styles.row}>
                                <div className={styles.centerFont}>
                                  <div style={{ paddingRight: "5px", color: "rgb(2,50,92)" }} className={styles.price}>
                                    $
                                  </div>
                                  <div style={{ color: "rgb(2,50,92)" }} className={styles.modelSmallish}>
                                    {toner.serviceLevels[0].price}
                                  </div>
                                </div>
                              </div>
                              <div className={styles.row}>
                                <div style={{ paddingRight: "5px" }} className={styles.priceSmall}>
                                  OEM:
                                </div>
                                <div className={styles.modelSmall}>{toner.oemNos[0]?.oemNo}</div>
                              </div>
                            </div>
                          </div>
                          <div style={{ width: "85%" }} className={styles.row}>
                            <Link href={`/tonerChoice?oem=${toner.oemNos[0].oemNo}`}>
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
                                      oem: toner.oemNos[0].oemNo,
                                      price: toner.serviceLevels[0].price,
                                      quantity: 1,
                                      image: toner.images[0],
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
                  )}
                </div>
              ) : (
                <div className={styles.center}>
                  <Audio
                    height="100"
                    width="100"
                    color="rgb(2, 50, 92)"
                    ariaLabel="loading"
                  />
                </div>
              )}
            </>
          ) : (
            <div className={styles.center}>
              <Audio
                height="100"
                width="100"
                color="rgb(2, 50, 92)"
                ariaLabel="loading"
              />
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
