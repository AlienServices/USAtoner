"use client"
import React, { useState, useRef, useContext, useEffect, useDebugValue } from "react";
import Head from "next/head";
import Image from "next/image";
import { Audio } from 'react-loader-spinner'
import Header from "./components/Header";
import BestSellers from "./components/BestSellers";
import Link from "next/link";
import styles from "./page.module.css";
import { CartContext } from "../app/providers/cart";
import Footer from "./components/Footer";
import { useRouter } from "next/navigation";

export default function Data() {
  const [name, setName] = useState("");
  const { token, cart, setCart, cartLook, setRealPrice, tonerOem } = useContext(CartContext);
  const [recaptchaResponse, setRecaptchaResponse] = useState(false);
  const [inputData, setInputData] = useState("");
  const [number, setNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [message, setMessage] = useState("this is the test message");
  const tawkMessengerRef = useRef();
  const [toner, setToner] = useState();
  const captchaRef = useRef(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/products', {
          method: "POST",
          body: JSON.stringify({ 
            token: JSON.parse(localStorage.getItem("token"))?.accessToken
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setProducts(data.cancel.products || []);
          setSearching(true);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setInputData(searchTerm);

    if (searchTerm === "") {
      setSearchResult(null);
      return;
    }

    const filtered = products.filter((item) =>
      item.oem?.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm)
    );
    setSearchResult(filtered);
  };

  useEffect(() => {
    if (localStorage.getItem("main")) {
      setSearching(true);
      setToner(JSON.parse(localStorage.getItem("main")));
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
                  Shop from our American Made toners
                </div>
              </h1>
              <input onChange={handleSearch} onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearching(!searching);
                  window.location.replace('/#toner');
                }
              }} className={styles.search} placeholder="Shop by OEM, Brand, or Model"></input>
            </div>
            <div className={styles.displayNone}>
              <Image
                src="/static/copierImage.webp"
                alt="buy a used or new business copier"
                width={500}
                height={300}
              />
            </div>
          </div>
        </div>
        <section id={"toner"}></section>
        <div className={styles.center}>
          {loading ? (
            <Audio
              height="80"
              width="80"
              radius="9"
              color="black"
              ariaLabel="loading"
              wrapperStyle
              wrapperClass
            />
          ) : (
            <>
              {searchResult ? (
                <>
                  {searchResult.length > 0 ? (
                    <div className={styles.boxContainer}>
                      {searchResult.slice(0, 24).map((item, index) => (
                        <div
                          key={`${item.oem}-${index}`}
                          className={styles.box}
                        >
                          <div className={styles.imageContainer}>
                            <Image
                              alt={'image of toner'}
                              style={{ borderRadius: "5px" }}
                              src={item.images?.[0] || '/placeholder-toner.jpg'}
                              width={180}
                              height={180}
                              priority={index < 4}
                            />
                          </div>
                          <div className={styles.something}>
                            <div style={{ fontSize: "18px", textAlign: "center" }}>
                              {item.oem}
                            </div>
                            <div style={{ fontSize: "13px", textAlign: "center" }}>
                              {item.description}
                            </div>
                            <div style={{ fontSize: "18px", textAlign: "center" }}>
                              ${item.price}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div className={styles.nothing}>No Products Found, Search Something Else</div>
                    </div>
                  )}
                </>
              ) : (
                <div className={''}><Audio
                  height="150"
                  width="100"
                  radius="10"
                  color="rgb(47,51,63)"
                  ariaLabel="loading"
                  wrapperStyle
                  wrapperClass
                /></div>
              )}
            </>
          )}
        </div>
      </div >
      <Footer />
    </div >
  );
}

// // // import Toners from "./api/models/Toners"
// // // (async () => {
// // //   try{
// // //     await Toners.create({name: "kale", email: "gmail.com"})
// // //     await Toners.create({name: "jason", email: "j@gmail.com"})
// // //     const toners = await Toner.findAll()
// // //     console.log(toners, "these is tonersss")
// // //   } catch(err){
// // //     console.log(err)
// // //   }
// // // })

// export default function Test() {
//   return <div></div>
// }