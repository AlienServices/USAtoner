"use client"
import React, { useState, useRef, useContext, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import Header from "../components/Header";
import BestSellers from "../components/BestSellers";
import AllOptions from "../components/AllOptions";
import Link from "next/link";
import styles from "../page.module.css";
import Footer from "../components/Footer";
import { useRouter } from "next/navigation";
import { Audio } from 'react-loader-spinner'
import { CartContext } from "../providers/cart/index";
import { removeCloverImaging, extractPrinterModels } from "../../lib/utility";
import PrinterModelList from "../components/PrinterModelList";
import OriginFilter from "../components/OriginFilter";

export default function Data() {
  const { cart, setCart, tonerOem } = useContext(CartContext);
  const [name, setName] = useState("");
  const [recaptchaResponse, setRecaptchaResponse] = useState(false);
  const [products, setProducts] = useState("");
  const [email, setEmail] = useState("");
  const [inputData, setInputData] = useState("");
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("this is the test message");
  const tawkMessengerRef = useRef();
  const captchaRef = useRef(null);
  const [token, setToken] = useState();
  const [searchResult, setSearchResult] = useState();
  const [toner, setToner] = useState();
  const [printerModels, setPrinterModels] = useState([]);
  const [isModelView, setIsModelView] = useState(true); // Default to model view
  const router = useRouter();
  const [originFilters, setOriginFilters] = useState({
    usaMade: false,
    americasMade: false,
    worldWideMade: false,
    chineseMade: false
  });
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  const onLoad = () => {
    console.log("onLoad works!");
  };
  const handleMinimize = () => {
    tawkMessengerRef.current.minimize();
  };
  
  var verifyCallback = function (response) {
    setRecaptchaResponse(response);
  };

  const handleOriginFilterChange = (filters) => {
    setOriginFilters(filters);
  };

  // Function to filter products based on origin
  const filterProductsByOrigin = (products) => {
    // If no filters are active, return all products
    if (!originFilters.usaMade && !originFilters.americasMade && !originFilters.worldWideMade) {
      return products;
    }

    return products.filter(product => {
      // Check if product has origin information
      const origin = product.origin || 'unknown';
      
      // Apply filters
      if (originFilters.usaMade && origin.toLowerCase().includes('usa')) {
        return true;
      }
      
      if (originFilters.americasMade && 
          (origin.toLowerCase().includes('usa') || 
           origin.toLowerCase().includes('canada') || 
           origin.toLowerCase().includes('mexico') ||
           origin.toLowerCase().includes('americas'))) {
        return true;
      }
      
      if (originFilters.worldWideMade) {
        // Only show Chinese products if the Chinese toggle is on
        if (origin.toLowerCase().includes('china')) {
          return originFilters.chineseMade;
        }
        // For all other worldwide products, show them
        return true;
      }
      
      return false;
    });
  };

  async function search() {
    setProducts();
    
    try {
      // Check if localStorage is available (for SSR)
      if (typeof window === 'undefined') {
        return;
      }
      
      let aToken;
      try {
        aToken = JSON.parse(localStorage.getItem("token"));
      } catch (error) {
        console.error("Error parsing token:", error);
        return;
      }
      
      if (!aToken || !aToken.accessToken) {
        console.error("No valid token found");
        return;
      }
      
      const requestOptions = {
        method: "POST",
        body: JSON.stringify({
          token: aToken.accessToken,
          search: inputData
        })
      };
      
      const response = await fetch('/api/products', requestOptions);
      const data1 = await response.json();
      setSearchResult(data1.cancel.products);
      setIsModelView(false); // Switch to product view when searching
      setSearching(true);
      // Also update filteredProducts based on origin filters
      setFilteredProducts(filterProductsByOrigin(data1.cancel.products));
    } catch (err) {
      console.error("Error searching products:", err);
    }
  }

  async function getProducts() {
    try {
      // Check if localStorage is available (for SSR)
      if (typeof window === 'undefined') {
        return;
      }
      
      let aToken;
      try {
        aToken = JSON.parse(localStorage.getItem("token"));
      } catch (error) {
        console.error("Error parsing token:", error);
        return;
      }
      
      if (!aToken || !aToken.accessToken) {
        console.error("No valid token found");
        return;
      }
      
      const requestOptions = {
        method: "POST",
        body: JSON.stringify({ token: aToken.accessToken, search: "brother" })
      };
      
      const response = await fetch('/api/products', requestOptions);
      const data1 = await response.json();
      
      setSearching(true);
      localStorage.setItem("brother", JSON.stringify(data1.cancel.products));
      setProducts(data1.cancel.products);
      
      // Extract and organize printer models
      const models = extractPrinterModels(data1.cancel.products);
      setPrinterModels(models);
      // Initialize filteredProducts with all products
      setFilteredProducts(data1.cancel.products);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  }

  useEffect(() => {
    getProducts();
  }, [token]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem("brother")) {
      try {
        const storedProducts = JSON.parse(localStorage.getItem("brother"));
        if (storedProducts && Array.isArray(storedProducts)) {
          setToner(storedProducts);
          setSearching(true);
          
          // Extract and organize printer models from stored products
          const models = extractPrinterModels(storedProducts);
          setPrinterModels(models);
          // Initialize filteredProducts with all products
          setFilteredProducts(storedProducts);
        }
      } catch (error) {
        console.error("Error loading stored products:", error);
      }
    }
  }, [products]);

  // Update filtered products when origin filters change
  useEffect(() => {
    if (searchResult) {
      setFilteredProducts(filterProductsByOrigin(searchResult));
    } else if (toner) {
      setFilteredProducts(filterProductsByOrigin(toner));
    }
  }, [originFilters, searchResult, toner]);

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
                  Brother Printer Models & Supplies
                </div>
              </h1>
              <input 
                onChange={(event) => setInputData(event.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsModelView(false);
                    window.location.replace('#toner');
                    search();
                  }
                }} 
                className={styles.search} 
                placeholder="Search by Model or OEM number"
              />
              
              <div className={styles.viewToggle}>
                <button 
                  className={`${styles.viewToggleButton} ${isModelView ? styles.activeViewButton : ''}`}
                  onClick={() => setIsModelView(true)}
                >
                  View by Models
                </button>
                <button 
                  className={`${styles.viewToggleButton} ${!isModelView ? styles.activeViewButton : ''}`}
                  onClick={() => setIsModelView(false)}
                >
                  View All Products
                </button>
              </div>
            </div>

            <div className={styles.displayNone}>
              <Image
                src="/static/Group.webp"
                alt="Brother printers and supplies"
                width={500}
                height={300}
              />
            </div>
          </div>
        </div>

        <section id={"toner"}></section>
        <div className={styles.center}>
          {isModelView ? (
            // Model view - display printer models
            <PrinterModelList models={printerModels} brandName="Brother" />
          ) : (
            // Product view - display all products with filters
            <>
              <div className={styles.productSection}>
                {filteredProducts?.length > 0 ? (
                  <div className={styles.boxContainer}>
                    {filteredProducts?.slice(0, 24)?.map((toner) => (
                      <div key={toner.oemNos[0]?.oemNo || toner.id} className={styles.box}>
                        <Image
                          alt={'image of toner'}
                          style={{ borderRadius: "5px" }}
                          src={toner.images[0]}
                          width={180}
                          height={180}
                        />
                        <div className={styles.titleSmallBlack}>{removeCloverImaging(toner.title)}</div>
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
                            setTonerOem(toner.oem);
                            localStorage.setItem("tonerOem", toner.oem);
                          }}
                          className={styles.somethingElse}
                          href={`/tonerChoice?oem=${toner.oem}`}
                        />
                        <div style={{ width: "85%" }} className={styles.row}>
                          <Link href={`/tonerChoice?oem=${toner.oemNos[0]?.oemNo}`}>
                            <button className={styles.buttonBlue}>See Details</button>
                          </Link>
                          <Link href={'/carts'}>
                            <button style={{ backgroundColor: "rgb(131,208,130)" }} className={styles.buttonBlue} onClick={() => {
                              const updatedCart = [
                                ...cart,
                                {
                                  name: removeCloverImaging(toner.title),
                                  oem: toner.oemNos[0]?.oemNo,
                                  price: toner.serviceLevels[0].price,
                                  quantity: 1,
                                  image: toner.images[0],
                                },
                              ];
                              setCart(updatedCart);
                            }}>Add to cart</button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyProductsContainer}>
                    <div className={styles.nothing}>No Products Found, Try Changing Your Filter or Search</div>
                  </div>
                )}
              </div>
              <OriginFilter onFilterChange={handleOriginFilterChange} />
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
