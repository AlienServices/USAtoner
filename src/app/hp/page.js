"use client"
import React, { useState, useRef, useContext, useEffect } from "react";
import Image from "next/image";
import { Audio } from 'react-loader-spinner'
import Header from "../components/Header";
import Link from "next/link";
import styles from "../page.module.css";
import { CartContext } from "../providers/cart/index";
import Footer from "../components/Footer";
import { useRouter } from "next/navigation";
import { removeCloverImaging, extractPrinterModels } from "../../lib/utility";
import PrinterModelList from "../components/PrinterModelList";
import OriginFilter from "../components/OriginFilter";

export default function HPPage() {
  const { cart, setCart, tonerOem } = useContext(CartContext);
  const [inputData, setInputData] = useState('');
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchResult, setSearchResult] = useState();
  const [toner, setToner] = useState();
  const [printerModels, setPrinterModels] = useState([]);
  const [isModelView, setIsModelView] = useState(true);
  const router = useRouter();
  const [originFilters, setOriginFilters] = useState({
    usaMade: false,
    americasMade: false,
    worldWideMade: false,
    chineseMade: false
  });
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);

  const handleOriginFilterChange = (filters) => {
    setOriginFilters(filters);
  };

  // Function to filter products based on origin
  const filterProductsByOrigin = (products) => {
    if (!originFilters.usaMade && !originFilters.americasMade && !originFilters.worldWideMade) {
      return products;
    }

    return products.filter(product => {
      const origin = product.origin || 'unknown';
      
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
        if (origin.toLowerCase().includes('china')) {
          return originFilters.chineseMade;
        }
        return true;
      }
      
      return false;
    });
  };

  async function search() {
    setProducts();
    
    try {
      if (typeof window === 'undefined') return;
      
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: aToken.accessToken,
          search: inputData
        })
      };
      
      const response = await fetch('/api/products', requestOptions);
      const data1 = await response.json();
      setSearchResult(data1.cancel.products);
      setIsModelView(false);
      setSearching(true);
      setFilteredProducts(filterProductsByOrigin(data1.cancel.products));
    } catch (err) {
      console.error("Error searching products:", err);
    }
  }

  async function getProducts() {
    setLoading(true);
    setError(null);
    
    try {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }
      
      let aToken;
      try {
        aToken = JSON.parse(localStorage.getItem("token"));
      } catch (error) {
        console.error("Error parsing token:", error);
        setError("Failed to load authentication token");
        setLoading(false);
        return;
      }
      
      if (!aToken || !aToken.accessToken) {
        console.error("No valid token found");
        setError("Authentication token not found");
        setLoading(false);
        return;
      }
      
      const requestOptions = {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: aToken.accessToken, search: "hp" })
      };
      
      const response = await fetch('/api/products', requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      let data1;
      try {
        data1 = await response.json();
      } catch (error) {
        console.error("Error parsing response:", error);
        throw new Error("Failed to parse server response");
      }
      
      if (!data1 || typeof data1 !== 'object' || !data1.cancel || !Array.isArray(data1.cancel.products)) {
        throw new Error("Invalid response format from API");
      }
      
      const validProducts = data1.cancel.products.filter(product => {
        return product && 
               typeof product === 'object' && 
               Array.isArray(product.images) && 
               Array.isArray(product.serviceLevels) &&
               Array.isArray(product.oemNos);
      });
      
      if (validProducts.length === 0) {
        throw new Error("No valid products found in response");
      }
      
      setSearching(true);
      localStorage.setItem("hp", JSON.stringify(validProducts));
      setProducts(validProducts);
      
      const models = extractPrinterModels(validProducts);
      setPrinterModels(models);
      setFilteredProducts(validProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      getProducts();
    } catch (error) {
      console.error("Error in useEffect:", error);
      setError("Failed to initialize products");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem("hp")) {
      try {
        const storedProducts = JSON.parse(localStorage.getItem("hp"));
        if (storedProducts && Array.isArray(storedProducts)) {
          setToner(storedProducts);
          setSearching(true);
          const models = extractPrinterModels(storedProducts);
          setPrinterModels(models);
          setFilteredProducts(storedProducts);
        }
      } catch (error) {
        console.error("Error loading stored products:", error);
      }
    }
  }, [products]);

  useEffect(() => {
    if (searchResult) {
      setFilteredProducts(filterProductsByOrigin(searchResult));
    } else if (toner) {
      setFilteredProducts(filterProductsByOrigin(toner));
    }
  }, [originFilters, searchResult, toner]);

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setIsModelView(false);
    const modelProducts = products.filter(product => 
      product.title.toLowerCase().includes(model.toLowerCase())
    );
    setFilteredProducts(modelProducts);
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
                  HP Printer Models & Supplies
                </div>
              </h1>
              <input 
                onChange={(event) => setInputData(event.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearching(!searching);
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
                  onClick={() => {
                    setIsModelView(true);
                    setSelectedModel(null);
                  }}
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
                alt="HP printers and supplies"
                width={500}
                height={300}
              />
            </div>
          </div>
        </div>

        <section id={"toner"}></section>
        <div className={styles.center}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <Audio
                height="150"
                width="100"
                radius="10"
                color="rgb(47,51,63)"
                ariaLabel="loading"
                wrapperStyle
                wrapperClass
              />
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <div className={styles.errorMessage}>{error}</div>
              <button 
                className={styles.retryButton}
                onClick={() => getProducts()}
              >
                Retry
              </button>
            </div>
          ) : searching ? (
            <>
              {isModelView ? (
                <PrinterModelList 
                  models={printerModels} 
                  brandName="HP"
                  onModelSelect={handleModelSelect}
                />
              ) : (
                <>
                  {selectedModel && (
                    <div className={styles.modelProductsHeader}>
                      <h1 className={styles.modelProductsTitle}>
                        Supplies for HP {selectedModel}
                      </h1>
                      <button 
                        className={styles.backLink}
                        onClick={() => {
                          setSelectedModel(null);
                          setIsModelView(true);
                        }}
                      >
                        &larr; Back to Models
                      </button>
                    </div>
                  )}
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
                            </div>
                            <div style={{ width: "85%" }} className={styles.row}>
                              <Link href={`/tonerChoice?oem=${toner.oemNos[0]?.oemNo}`}>
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
                                        name: removeCloverImaging(toner.title),
                                        oem: toner.oemNos[0]?.oemNo,
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
                    ) : (
                      <div className={styles.emptyProductsContainer}>
                        <div className={styles.nothing}>
                          {selectedModel 
                            ? `No supplies found for HP ${selectedModel}`
                            : "No Products Found, Try Changing Your Filter or Search"}
                        </div>
                      </div>
                    )}
                  </div>
                  <OriginFilter onFilterChange={handleOriginFilterChange} />
                </>
              )}
            </>
          ) : (
            <div className={''}>
              <Audio
                height="150"
                width="100"
                radius="10"
                color="rgb(47,51,63)"
                ariaLabel="loading"
                wrapperStyle
                wrapperClass
              />
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
