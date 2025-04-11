"use client"
import React, { useState, useRef, useContext, useEffect, useDebugValue } from "react";
import Head from "next/head";
import Image from "next/image";
import { Audio } from 'react-loader-spinner'
import Header from "./components/Header";
import BestSellers from "./components/BestSellers";
import OriginFilter from "./components/OriginFilter";
import Link from "next/link";
import styles from "./page.module.css";
import { CartContext } from "../app/providers/cart";
import Footer from "./components/Footer";
import { useRouter } from "next/navigation";
import { removeCloverImaging } from "../lib/utility";

export default function Data() {

  const [name, setName] = useState("");
  const { token, cart, setCart, cartLook, setRealPrice, tonerOem } = useContext(CartContext);
  const [recaptchaResponse, setRecaptchaResponse] = useState(false);
  const [inputData, setInputData] = useState()
  const [number, setNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchResult, setSearchResult] = useState();
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [message, setMessage] = useState("this is the test message");
  const tawkMessengerRef = useRef();
  const [toner, setToner] = useState()
  const captchaRef = useRef(null);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [originFilters, setOriginFilters] = useState({
    usaMade: false,
    americasMade: false,
    worldWideMade: false,
    chineseMade: false
  });
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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

  // Add new function to handle token refresh
  async function refreshToken() {
    try {
      const response = await fetch('/api/token', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      
      const data = await response.json();
      if (data.cancel && data.cancel.accessToken) {
        localStorage.setItem("token", JSON.stringify(data.cancel));
        return data.cancel.accessToken;
      }
      throw new Error('Invalid token response');
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  async function search() {
    if (!inputData || inputData.trim() === '') {
      return;
    }
    
    // Get token from localStorage
    let aToken;
    try {
      aToken = JSON.parse(localStorage.getItem("token"));
      if (!aToken || !aToken.accessToken) {
        console.log("No valid token found, attempting to refresh...");
        aToken = { accessToken: await refreshToken() };
      }
    } catch (err) {
      console.error("Error parsing token:", err);
      try {
        console.log("Attempting to refresh token after parse error...");
        aToken = { accessToken: await refreshToken() };
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        setError("Authentication error. Please refresh the page to continue.");
        return;
      }
    }
    
    // Preprocess search term - normalize for better searching
    let searchTerm = inputData.trim();
    let isBrandSearch = false;
    
    // Check if it's likely an OEM part number and format appropriately
    const oemPatterns = [
      /^(CE|CC|CF|Q|CB)\d{3,4}[A-Z]?$/i,  // HP patterns like CE285A, CF380A
      /^(TN|DR)-\d{3,4}[A-Z]?$/i,          // Brother patterns like TN-760
      /^(593-|331-|332-)\w{4,5}$/i,        // Dell patterns like 593-BBKD
      /^(106R|113R)\d{5}$/i,               // Xerox patterns like 106R01371
      /^\d{2}[A-Z]\d{4}$/i                 // Lexmark patterns like 50F1000
    ];
    
    const isLikelyOemNumber = oemPatterns.some(pattern => pattern.test(searchTerm));
    
    // If appears to be an OEM number, ensure proper formatting
    if (isLikelyOemNumber) {
      // Make sure HP part numbers are uppercase at the end (e.g., CE285A not CE285a)
      searchTerm = searchTerm.replace(/^(CE|CC|CF|Q|CB)(\d{3,4})([a-z])$/i, (_, p1, p2, p3) => 
        `${p1}${p2}${p3.toUpperCase()}`
      );
      
      // For Brother, ensure proper dash (TN-760 not TN760)
      if (/^(TN|DR)\d{3,4}[A-Z]?$/i.test(searchTerm)) {
        searchTerm = searchTerm.replace(/^(TN|DR)(\d{3,4}[A-Z]?)$/i, "$1-$2");
      }
    } else {
      // If not an OEM number, check if it's a brand name
      // Known printer brands with their correct search terms
      const brandMapping = {
        'hp': 'HP',
        'hewlett packard': 'HP',
        'hewlett-packard': 'HP',
        'brother': 'Brother',
        'canon': 'Canon',
        'xerox': 'Xerox',
        'lexmark': 'Lexmark',
        'dell': 'Dell',
        'konica': 'Konica Minolta',
        'minolta': 'Konica Minolta',
        'konica minolta': 'Konica Minolta',
        'konika': 'Konica Minolta',
        'kyocera': 'Kyocera',
        'epson': 'Epson',
        'samsung': 'Samsung',
        'ricoh': 'Ricoh',
        'sharp': 'Sharp',
        'toshiba': 'Toshiba',
        'panasonic': 'Panasonic',
        'oki': 'Oki',
        'okidata': 'Oki'
      };
      
      const lowercaseSearch = searchTerm.toLowerCase();
      
      // Check if search term exactly matches or contains a brand name
      for (const [brandKey, brandValue] of Object.entries(brandMapping)) {
        if (lowercaseSearch === brandKey || 
            lowercaseSearch.includes(brandKey) && 
            // Make sure we're matching full words, not partial matches
            (lowercaseSearch === brandKey || 
             lowercaseSearch.startsWith(brandKey + ' ') || 
             lowercaseSearch.endsWith(' ' + brandKey) || 
             lowercaseSearch.includes(' ' + brandKey + ' '))) {
          console.log(`Detected brand search: ${brandKey} -> ${brandValue}`);
          searchTerm = brandValue;
          isBrandSearch = true;
          break;
        }
      }
    }
    
    console.log(`Processing search with term: "${searchTerm}"`);
    
    // Store the current search term for the UI
    setCurrentSearchTerm(searchTerm);
    
    // Set loading state
    setSearching(true);
    
    // For brand searches, we might need to append a common model term to get better results
    if (isBrandSearch) {
      // First try to get brand-specific inventory
      try {
        console.log(`Fetching brand-specific inventory for: ${searchTerm}`);
        const dmResponse = await fetch('/api/dm-brand-products', {
          method: 'POST',
          body: JSON.stringify({ brand: searchTerm })
        });
        
        if (dmResponse.ok) {
          const dmData = await dmResponse.json();
          if (dmData.success && dmData.data && Array.isArray(dmData.data.products)) {
            console.log(`Found ${dmData.data.products.length} brand-specific products`);
            
            // Format these products to match the expected structure
            const formattedDmProducts = dmData.data.products.map(product => ({
              ...product,
              serviceLevels: product.serviceLevels || [{ price: product.price || '0.00' }],
              images: product.images || ['/static/toner-placeholder.webp'],
              oemNos: product.oemNos || [{ oemNo: product.referenceNumber || 'Unknown', oem: product.manufacturer || searchTerm }]
            }));
            
            // Also fetch regular products
            const regularResponse = await fetch('/api/products', {
              method: 'POST',
              body: JSON.stringify({
                token: aToken.accessToken,
                search: searchTerm
              })
            });
            
            if (regularResponse.ok) {
              const regularData = await regularResponse.json();
              if (regularData.cancel && Array.isArray(regularData.cancel.products)) {
                // Combine both result sets
                const combinedProducts = [...formattedDmProducts, ...regularData.cancel.products];
                console.log(`Combined ${combinedProducts.length} products from both sources`);
                setSearchResult(combinedProducts);
                setFilteredProducts(filterProductsByOrigin(combinedProducts));
                return;
              }
            }
            
            // If we can't get regular products, just use the DM ones
            setSearchResult(formattedDmProducts);
            setFilteredProducts(filterProductsByOrigin(formattedDmProducts));
            return;
          }
        }
      } catch (brandError) {
        console.error("Error fetching brand-specific inventory:", brandError);
        // Fall back to regular search
      }
      
      // Enhance brand searches with common terms
      if (searchTerm === 'HP') {
        searchTerm = 'HP LaserJet';
      } else if (searchTerm === 'Brother') {
        searchTerm = 'Brother TN';
      } else if (searchTerm === 'Lexmark') {
        searchTerm = 'Lexmark toner';
      } else if (searchTerm === 'Konica Minolta') {
        searchTerm = 'Konica Minolta bizhub';
      }
      
      console.log(`Enhanced brand search to: "${searchTerm}"`);
    }
    
    const requestOptions = {
      method: "POST",
      body: JSON.stringify({
        token: aToken.accessToken,
        search: searchTerm
      })
    };
    
    try {
      const response = await fetch('/api/products', requestOptions);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.cancel && Array.isArray(data.cancel.products)) {
        console.log(`Found ${data.cancel.products.length} products for search: "${searchTerm}"`);
        setSearchResult(data.cancel.products);
        setFilteredProducts(filterProductsByOrigin(data.cancel.products));
      } else {
        console.warn("Search returned no products or unexpected format");
        setSearchResult([]);
        setFilteredProducts([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchResult([]);
      setFilteredProducts([]);
    } finally {
      // Always ensure searching state is updated even if there's an error
      setSearching(false);
      setSearching(true); // We need to keep this true to show the results UI
    }
  }

  const handleSearch = () => {
    window.location.replace('/#toner');
    search();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

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
        const tokenData = localStorage.getItem("token");
        if (!tokenData) {
          // No token found, redirect to login
          window.location.href = '/login';
          return;
        }
        aToken = JSON.parse(tokenData);
        if (!aToken || !aToken.accessToken) {
          // Invalid token, redirect to login
          localStorage.removeItem("token");
          window.location.href = '/login';
          return;
        }
      } catch (tokenError) {
        console.error("Token error:", tokenError);
        localStorage.removeItem("token");
        window.location.href = '/login';
        return;
      }
      
      const requestOptions = {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: aToken.accessToken, search: "" })
      };
      
      try {
        const response = await fetch('/api/products', requestOptions);
        
        if (!response.ok) {
          const errorData = await response.json();
          
          // Check for specific error cases
          if (errorData.details && errorData.details.message === "Not Logged In") {
            localStorage.removeItem("token");
            window.location.href = '/login';
            return;
          }
          
          // Check if token is expired
          if (errorData.details && errorData.details.message === "Token expired") {
            // Try to refresh the token
            try {
              const refreshResponse = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken: aToken.refreshToken })
              });
              
              if (refreshResponse.ok) {
                const newTokenData = await refreshResponse.json();
                localStorage.setItem("token", JSON.stringify(newTokenData));
                
                // Retry the original request with new token
                const newRequestOptions = {
                  method: "POST",
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ token: newTokenData.accessToken, search: "" })
                };
                
                const retryResponse = await fetch('/api/products', newRequestOptions);
                if (!retryResponse.ok) {
                  throw new Error(`API error after token refresh: ${retryResponse.status}`);
                }
                
                const data1 = await retryResponse.json();
                await processProducts(data1);
              } else {
                // If refresh fails, clear the token and redirect to login
                localStorage.removeItem("token");
                window.location.href = '/login';
                return;
              }
            } catch (refreshError) {
              console.error("Token refresh failed:", refreshError);
              localStorage.removeItem("token");
              window.location.href = '/login';
              return;
            }
          } else {
            throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
          }
        } else {
          const data1 = await response.json();
          await processProducts(data1);
        }
      } catch (apiError) {
        console.error("API request failed:", apiError);
        // Try to load from cache if available
        const cachedProducts = localStorage.getItem("main");
        if (cachedProducts) {
          try {
            const parsedCache = JSON.parse(cachedProducts);
            if (Array.isArray(parsedCache) && parsedCache.length > 0) {
              setProducts(parsedCache);
              setFilteredProducts(parsedCache);
              setLoading(false);
              return;
            }
          } catch (cacheError) {
            console.error("Error parsing cached products:", cacheError);
          }
        }
        throw apiError;
      }
    } catch (err) {
      console.error("Error in getProducts:", err);
      setError(err.message || "Failed to fetch products. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  // Helper function to process products data
  async function processProducts(data1) {
    try {
      let products = [];
      
      // Handle different possible response formats
      if (data1 && typeof data1 === 'object') {
        if (data1.cancel && Array.isArray(data1.cancel.products)) {
          products = data1.cancel.products;
        } else if (data1.products && Array.isArray(data1.products)) {
          products = data1.products;
        } else if (Array.isArray(data1)) {
          products = data1;
        } else if (data1.data && Array.isArray(data1.data)) {
          products = data1.data;
        } else if (data1.results && Array.isArray(data1.results)) {
          products = data1.results;
        } else {
          // Try to find any array in the response
          for (const key in data1) {
            if (Array.isArray(data1[key])) {
              products = data1[key];
              break;
            } else if (data1[key] && typeof data1[key] === 'object') {
              for (const subKey in data1[key]) {
                if (Array.isArray(data1[key][subKey])) {
                  products = data1[key][subKey];
                  break;
                }
              }
              if (products.length > 0) break;
            }
          }
        }
      }
      
      // Validate products array
      if (!Array.isArray(products) || products.length === 0) {
        console.warn("No valid products found in response:", data1);
        // Try to load from cache
        const cachedProducts = localStorage.getItem("main");
        if (cachedProducts) {
          try {
            const parsedCache = JSON.parse(cachedProducts);
            if (Array.isArray(parsedCache) && parsedCache.length > 0) {
              products = parsedCache;
            }
          } catch (cacheError) {
            console.error("Error parsing cached products:", cacheError);
          }
        }
      }
      
      if (products.length > 0) {
        setSearching(true);
        localStorage.setItem("main", JSON.stringify(products));
        setProducts(products);
        
        // Try to also get brand-specific inventories for popular brands
        try {
          const popularBrands = ['HP', 'Brother', 'Xerox', 'Lexmark', 'Dell', 'Konica Minolta'];
          const brandProducts = [];
          
          for (const brand of popularBrands) {
            const dmResponse = await fetch('/api/dm-brand-products', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ brand })
            });
            
            if (dmResponse.ok) {
              const dmData = await dmResponse.json();
              if (dmData.success && dmData.data && Array.isArray(dmData.data.products)) {
                // Format these products to match the expected structure
                const formattedDmProducts = dmData.data.products.map(product => ({
                  ...product,
                  serviceLevels: product.serviceLevels || [{ price: product.price || '0.00' }],
                  images: product.images || ['/static/toner-placeholder.webp'],
                  oemNos: product.oemNos || [{ oemNo: product.referenceNumber || 'Unknown', oem: product.manufacturer || brand }]
                }));
                
                brandProducts.push(...formattedDmProducts);
              }
            }
          }
          
          if (brandProducts.length > 0) {
            // Combine with regular products
            const combinedProducts = [...products, ...brandProducts];
            localStorage.setItem("main", JSON.stringify(combinedProducts));
            setProducts(combinedProducts);
            setInventoryLoaded(true);
          }
        } catch (dmError) {
          console.error("Error fetching additional brand inventory:", dmError);
          // Continue with regular products even if DM products fail
        }
      } else {
        console.warn("No products available to display");
        setError("No products available at this time. Please try again later.");
      }
    } catch (processError) {
      console.error("Error processing products:", processError);
      // Try to load from cache as a last resort
      const cachedProducts = localStorage.getItem("main");
      if (cachedProducts) {
        try {
          const parsedCache = JSON.parse(cachedProducts);
          if (Array.isArray(parsedCache) && parsedCache.length > 0) {
            setProducts(parsedCache);
            setFilteredProducts(parsedCache);
            return;
          }
        } catch (cacheError) {
          console.error("Error parsing cached products:", cacheError);
        }
      }
      throw processError;
    }
  }

  useEffect(() => {
    getProducts()
  }, [token])


  useEffect(() => {
    if (localStorage.getItem("main")) {
      setSearching(true)
      const storedProducts = JSON.parse(localStorage.getItem("main"));
      setToner(storedProducts);
      // Initialize filteredProducts with all products
      setFilteredProducts(storedProducts);
    }
  }, [products])

  // Update filtered products when origin filters change
  useEffect(() => {
    if (searchResult) {
      setFilteredProducts(filterProductsByOrigin(searchResult));
    } else if (toner) {
      setFilteredProducts(filterProductsByOrigin(toner));
    }
  }, [originFilters, searchResult, toner]);

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
                  Shop from our Toners & Supplies
                </div>
              </h1>
              <div className={styles.searchContainer}>
                <input 
                  value={inputData || ''}
                  onChange={(event) => setInputData(event.target.value)}
                  onKeyDown={handleKeyDown}
                  className={styles.search} 
                  placeholder="Search by OEM, Brand, or Model"
                />
                <button 
                  onClick={handleSearch}
                  className={styles.searchButton}
                >
                  Search
                </button>
              </div>
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
            {/* Always render the filter regardless of product count */}
            <div className={styles.productSection}>
              {filteredProducts?.length > 0 ? (
                <div className={styles.boxContainer}>
                  {filteredProducts?.slice(0, 24)?.map((toner) => {
                    return (
                      <div
                        key={toner.oemNos[0]?.oemNo || toner.id}
                        className={styles.box}
                      >
                        <Image
                          alt={'image of toner'}
                          style={{ borderRadius: "5px" }}
                          src={toner.images[0]}
                          width={180}
                          height={180}
                        ></Image>
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
                            setTonerOem(toner.oem)
                            localStorage.setItem("tonerOem", toner.oem)
                          }}
                          className={styles.somethingElse}
                          href={`/tonerChoice?oem=${toner.oem}`}
                        ></Link>
                        <div style={{ width: "85%" }} className={styles.row}>
                          <Link href={`/tonerChoice?oem=${toner.oemNos[0]?.oemNo}`}>
                            <button className={styles.buttonBlue} onClick={() => {
                            }}>See Details</button>
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
                              setCart(updatedCart)
                            }}>Add to cart</button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyProductsContainer}>
                  <div className={styles.nothingContainer}>
                    <div className={styles.nothing}>No Products Found</div>
                    {currentSearchTerm && (
                      <div className={styles.searchInfo}>
                        <p>No results found for: <strong>"{currentSearchTerm}"</strong></p>
                        <div className={styles.searchSuggestions}>
                          <p>Suggestions:</p>
                          <ul>
                            <li>Check the spelling of your search term</li>
                            <li>Try using a more specific part number (e.g., CE285A, TN-760)</li>
                            <li>Search by printer model (e.g., "LaserJet Pro M402n")</li>
                            <li>Try a different brand name (HP, Brother, Xerox, etc.)</li>
                            <li>Clear any active filters that might be restricting results</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <OriginFilter onFilterChange={handleOriginFilterChange} />
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