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
  const [inputData, setInputData] = useState()
  const [number, setNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchResult, setSearchResult] = useState();
  const [message, setMessage] = useState("this is the test message");
  const tawkMessengerRef = useRef();
  const [toner, setToner] = useState()
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




  async function test() {
    const requestOptions = {
      method: "GET",
    }
    try {
      const response = await fetch('/api/models', requestOptions);
      const data1 = await response.json();
      console.log(data1.cancel, "this is the response")
    } catch (err) {
    }
  }


  const search = async (searchTerm) => {
    try {
      // Fetch Clover Imaging products
      const responseClover = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchTerm }),
      });
      const dataClover = await responseClover.json();

      // Fetch ITC inventory
      const responseITC = await fetch('/api/inventory');
      const dataITC = await responseITC.json();

      // Filter ITC products based on search term
      const filteredITC = dataITC.data.filter(product => 
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Transform ITC products to match Clover product structure
      const transformedITC = filteredITC.map(product => ({
        id: product.sku,
        title: product.description || 'ITC Product',
        price: Number(product.price).toFixed(2),
        images: ['/static/placeholder.svg'],
        description: product.description || '',
        category: 'ITC',
        quantity: product.quantity || 0,
        itcProduct: true,
        oemNos: [{
          oemNo: product.mfgPartNumber || product.sku
        }],
        serviceLevels: [{
          price: Number(product.price).toFixed(2)
        }],
        manufacturerName: product.manufacturerName || getBrandFromSKU(product.sku)
      }));

      // Format Clover products to ensure consistent structure
      const formattedClover = (dataClover?.cancel?.products || []).map(product => ({
        ...product,
        price: Number(product.price).toFixed(2),
        serviceLevels: product.serviceLevels?.map(level => ({
          ...level,
          price: Number(level.price).toFixed(2)
        }))
      }));

      // Combine results
      const combinedResults = [...formattedClover, ...transformedITC];
      setSearchResult(combinedResults);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResult([]);
    }
  };


  async function getProducts() {
    try {
      // Get token from localStorage if not available in context
      const tokenStr = localStorage.getItem("token");
      let aToken;
      
      if (tokenStr) {
        try {
          aToken = JSON.parse(tokenStr);
        } catch (e) {
          console.log("Error parsing token, skipping Clover search");
          aToken = null;
        }
      }

      if (aToken?.accessToken) {
        const requestOptions = {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            token: aToken.accessToken, 
            search: "" 
          })
        };

        // Fetch Clover Imaging products
        const responseClover = await fetch('/api/products', requestOptions);
        if (!responseClover.ok) throw new Error('Failed to fetch Clover products');
        const dataClover = await responseClover.json();

        // Fetch ITC inventory
        const responseITC = await fetch('/api/inventory');
        if (!responseITC.ok) throw new Error('Failed to fetch ITC inventory');
        const dataITC = await responseITC.json();

        // Transform ITC inventory to match Clover structure
        const transformedITCProducts = dataITC.data.map(item => ({
          id: item.sku,
          title: item.description || 'ITC Product',
          price: Number(item.price).toFixed(2),
          images: ['/static/placeholder.svg'],
          description: item.description || '',
          category: 'ITC',
          quantity: item.quantity || 0,
          itcProduct: true,
          oemNos: [{
            oemNo: item.mfgPartNumber || item.sku
          }],
          serviceLevels: [{
            price: Number(item.price).toFixed(2)
          }],
          manufacturerName: item.manufacturerName || getBrandFromSKU(item.sku)
        }));

        // Combine both inventories
        const cloverProducts = dataClover?.cancel?.products || [];
        const combinedProducts = [...cloverProducts, ...transformedITCProducts];
        
        // Format prices in combined products
        const formattedProducts = combinedProducts.map(product => ({
          ...product,
          price: Number(product.price).toFixed(2),
          serviceLevels: product.serviceLevels?.map(level => ({
            ...level,
            price: Number(level.price).toFixed(2)
          }))
        }));

        // Store full inventory in localStorage
        localStorage.setItem("fullInventory", JSON.stringify(formattedProducts));
        
        // Get featured products (Brother products) and limit to 24 items
        const featuredProducts = formattedProducts
          .filter(product => 
            product.manufacturerName?.toLowerCase().includes('brother') || 
            (product.title?.toLowerCase().includes('brother'))
          )
          .slice(0, 24);

        setSearching(true);
        localStorage.setItem("main", JSON.stringify(featuredProducts));
        localStorage.setItem("featured", JSON.stringify(featuredProducts));
        setProducts(featuredProducts);
        setToner(featuredProducts);
      } else {
        // If no token, just fetch ITC inventory
        const responseITC = await fetch('/api/inventory');
        if (!responseITC.ok) throw new Error('Failed to fetch ITC inventory');
        const dataITC = await responseITC.json();
        
        const transformedITCProducts = dataITC.data.map(item => ({
          id: item.sku,
          title: item.description || 'ITC Product',
          price: Number(item.price).toFixed(2),
          images: ['/static/placeholder.svg'],
          description: item.description || '',
          category: 'ITC',
          quantity: item.quantity || 0,
          itcProduct: true,
          oemNos: [{
            oemNo: item.mfgPartNumber || item.sku
          }],
          serviceLevels: [{
            price: Number(item.price).toFixed(2)
          }],
          manufacturerName: item.manufacturerName || getBrandFromSKU(item.sku)
        }));

        // Store full inventory
        localStorage.setItem("fullInventory", JSON.stringify(transformedITCProducts));
        
        // Limit initial display to 24 items
        const limitedProducts = transformedITCProducts.slice(0, 24);

        setSearching(true);
        localStorage.setItem("main", JSON.stringify(limitedProducts));
        localStorage.setItem("featured", JSON.stringify(limitedProducts));
        setProducts(limitedProducts);
        setToner(limitedProducts);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setSearching(false);
      // Try to load cached products if available
      const cachedProducts = localStorage.getItem("featured");
      if (cachedProducts) {
        try {
          setSearching(true);
          setToner(JSON.parse(cachedProducts));
        } catch (e) {
          console.error("Error loading cached products:", e);
        }
      }
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
  }, [token])


  useEffect(() => {
    if (localStorage.getItem("main")) {
      setSearching(true)
      setToner(JSON.parse(localStorage.getItem("main")))
    }
  }, [products])

  // console.log(token, "this is a test")
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
              <input onChange={(event) => {
                setInputData(event.target.value)
              }} onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearching(!searching)
                  window.location.replace('/#toner')
                  search(inputData)

                }
              }} className={styles.search} placeholder="Search by OEM, Brand, or Model"></input>
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
          {searching ? <>
            {toner?.length > 0 ? <div className={styles.boxContainer}>
              {searchResult?.length >= 1 ? <>{searchResult?.map((toner) => {
                return (
                  <div
                    key={toner.id || toner.sku}
                    className={styles.box}
                  >
                    <Image
                      alt={'image of toner'}
                      style={{ borderRadius: "5px" }}
                      src={toner.images?.[0] || '/static/placeholder.svg'}
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
                              {toner.serviceLevels?.[0]?.price || toner.price}
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
                          <div className={styles.modelSmall}>
                            {toner.oemNos?.[0]?.oemNo || toner.mfgPartNumber || toner.sku}
                          </div>
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
                        const oemValue = toner.oemNos?.[0]?.oemNo || toner.mfgPartNumber || toner.sku;
                        setTonerOem(oemValue);
                        localStorage.setItem("tonerOem", oemValue);
                      }}
                      className={styles.somethingElse}
                      href={`/tonerChoice?oem=${toner.oemNos?.[0]?.oemNo || toner.mfgPartNumber || toner.sku}`}
                    ></Link>
                    <div style={{ width: "85%" }} className={styles.row}>
                      <Link href={`/tonerChoice?oem=${toner.oemNos?.[0]?.oemNo || toner.mfgPartNumber || toner.sku}`}>
                        <button className={styles.buttonBlue}>See Details</button>
                      </Link>
                      <Link href={'/carts'}>
                        <button style={{ backgroundColor: "rgb(131,208,130)" }} className={styles.buttonBlue} onClick={() => {
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
                          setCart(updatedCart)
                        }}>Add to cart</button>
                      </Link>
                    </div>
                  </div>
                );
              })}</> : <>{toner?.map((toner) => {
                return (
                  <div
                    key={toner.id || toner.sku}
                    className={styles.box}
                  >
                    <Image
                      alt={'image of toner'}
                      style={{ borderRadius: "5px" }}
                      src={toner.images?.[0] || '/static/placeholder.svg'}
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
                              {toner.serviceLevels?.[0]?.price || toner.price}
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
                          <div className={styles.modelSmall}>
                            {toner.oemNos?.[0]?.oemNo || toner.mfgPartNumber || toner.sku}
                          </div>
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
                        const oemValue = toner.oemNos?.[0]?.oemNo || toner.mfgPartNumber || toner.sku;
                        setTonerOem(oemValue);
                        localStorage.setItem("tonerOem", oemValue);
                      }}
                      className={styles.somethingElse}
                      href={`/tonerChoice?oem=${toner.oemNos?.[0]?.oemNo || toner.mfgPartNumber || toner.sku}`}
                    ></Link>
                    <div style={{ width: "85%" }} className={styles.row}>
                      <Link href={`/tonerChoice?oem=${toner.oemNos?.[0]?.oemNo || toner.mfgPartNumber || toner.sku}`}>
                        <button className={styles.buttonBlue}>See Details</button>
                      </Link>
                      <Link href={'/carts'}>
                        <button style={{ backgroundColor: "rgb(131,208,130)" }} className={styles.buttonBlue} onClick={() => {
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
        <div className={styles.viewAllContainer}>
          <Link href="/all-products">
            <button className={styles.viewAllButton}>
              View All Products
            </button>
          </Link>
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