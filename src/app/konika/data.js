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
import { mergeInventory } from "@/utils/dataTransformers";

export default function Data() {
  const [name, setName] = useState("");
  const {token, cart, setCart, cartLook, setRealPrice, tonerOem } = useContext(CartContext);
  const [recaptchaResponse, setRecaptchaResponse] = useState(false);
  const [inputData, setInputData] = useState()
  const [number, setNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [message, setMessage] = useState("this is the test message");
  const tawkMessengerRef = useRef();
  const captchaRef = useRef(null);
  const [toner, setToner] = useState()
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const onLoad = () => {
    console.log("onLoad works!");
  };
  const handleMinimize = () => {
    tawkMessengerRef.current.minimize();
  };

  var verifyCallback = function (response) {
    setRecaptchaResponse(response);
  };

  async function search() {
    setProducts()
    // const aToken = JSON.parse(localStorage.getItem("token"))
    const requestOptions = {
      method: "POST",

      body:
        JSON.stringify({
          token: token,
          search: inputData
        })

    }
    try {
      const response = await fetch('/api/products', requestOptions);
      const data1 = await response.json();
      setSearching(true)
      setSearchResult(data1.cancel.products)            
    } catch (err) {
    }
  }

  useEffect(() => {
    async function fetchAllData() {
      try {
        // Fetch FTP data
        const ftpResponse = await fetch('/data/konika-catalog.json')
        const ftpData = ftpResponse.ok ? await ftpResponse.json() : []

        // Fetch Clover data
        const aToken = JSON.parse(localStorage.getItem("token"))
        const cloverResponse = await fetch('/api/products', {
          method: "POST",
          body: JSON.stringify({ token: aToken.accessToken, search: "konika" })
        })
        const cloverData = cloverResponse.ok ? 
          (await cloverResponse.json())?.cancel?.products || [] : []

        // Merge and normalize the data
        const mergedData = mergeInventory(cloverData, ftpData)
        
        setProducts(mergedData)
        setSearching(true)
        setLoading(false)
        
        // Cache the merged data
        localStorage.setItem("konika", JSON.stringify(mergedData))
      } catch (err) {
        console.error('Error fetching products:', err)
        setLoading(false)
      }
    }

    fetchAllData()
  }, [])

  useEffect(() => {
    if (localStorage.getItem("konica")) {
      setSearching(true)
      setToner(JSON.parse(localStorage.getItem("konica")))
    }
  }, [searching])

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
                  {searchResult.map((item, index) => (
                    <div
                      key={`${item.oem}-${item.source}-${index}`}
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
                        <div style={{ fontSize: "14px", textAlign: "center", color: item.stock > 0 ? 'green' : 'red' }}>
                          {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </div>
                        <div style={{ fontSize: "12px", textAlign: "center", color: 'gray' }}>
                          Source: {item.source === 'clover' ? 'Clover' : 'International'}
                        </div>
                      </div>
                      <Link
                        onClick={() => {
                          setTonerOem(item.oem)
                          localStorage.setItem("tonerOem", item.oem)
                        }}
                        className={styles.somethingElse}
                        href={`/tonerChoice?oem=${item.oemNos?.[0]?.oemNo || item.oem}`}
                      ></Link>
                      <div style={{ width: "85%" }} className={styles.row}>
                        <Link 
                          href={`/tonerChoice?oem=${item.oemNos?.[0]?.oemNo || item.oem}`}
                        >
                          <button 
                            className={styles.buttonBlue}
                            onClick={() => {}}
                          >
                            See Details
                          </button>
                        </Link>
                        <Link href={'/carts'}>
                          <button style={{ backgroundColor: "rgb(131,208,130)" }} className={styles.buttonBlue} onClick={() => {
                            const updatedCart = [
                              ...cart,
                              {
                                name: item.title,
                                oem: item.oemNos[0].oemNo,
                                price: item.serviceLevels[0].price,
                                quantity: 1,
                                image: item.images[0],
                              },
                            ];
                            setCart(updatedCart)
                          }}>Add to cart</button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                products?.slice(0, 24)?.map((item, index) => (
                  <div
                    key={`${item.oem}-${item.source}-${index}`}
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
                      <div style={{ fontSize: "14px", textAlign: "center", color: item.stock > 0 ? 'green' : 'red' }}>
                        {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </div>
                      <div style={{ fontSize: "12px", textAlign: "center", color: 'gray' }}>
                        Source: {item.source === 'clover' ? 'Clover' : 'International'}
                      </div>
                    </div>
                    <Link
                      onClick={() => {
                        setTonerOem(item.oem)
                        localStorage.setItem("tonerOem", item.oem)
                      }}
                      className={styles.somethingElse}
                      href={`/tonerChoice?oem=${item.oemNos?.[0]?.oemNo || item.oem}`}
                    ></Link>
                    <div style={{ width: "85%" }} className={styles.row}>
                      <Link 
                        href={`/tonerChoice?oem=${item.oemNos?.[0]?.oemNo || item.oem}`}
                      >
                        <button 
                          className={styles.buttonBlue}
                          onClick={() => {}}
                        >
                          See Details
                        </button>
                      </Link>
                      <Link href={'/carts'}>
                        <button style={{ backgroundColor: "rgb(131,208,130)" }} className={styles.buttonBlue} onClick={() => {
                          const updatedCart = [
                            ...cart,
                            {
                              name: item.title,
                              oem: item.oemNos[0].oemNo,
                              price: item.serviceLevels[0].price,
                              quantity: 1,
                              image: item.images[0],
                            },
                          ];
                          setCart(updatedCart)
                        }}>Add to cart</button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
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
