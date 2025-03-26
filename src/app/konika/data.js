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
  const {token, cart, setCart, cartLook, setRealPrice, tonerOem } = useContext(CartContext);
  const [recaptchaResponse, setRecaptchaResponse] = useState(false);
  const [inputData, setInputData] = useState()
  const [number, setNumber] = useState("");
  const [searching, setSearching] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState("");  
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


  const handleSearch = () => {
    if (inputData && inputData.trim()) {
      setIsLoading(true);
      setSearching(true);
      window.location.replace('#toner');
      search();
    } else {
      // If search is empty, reset to show all products
      resetToAllProducts();
    }
  };

  // Function to reset search and show all products
  const resetToAllProducts = () => {
    console.log('Resetting to show all products');
    setSearchResult(null); // Clear search results to show default toner list
    setInputData(''); // Clear search input
    
    // If we have toner data, make sure it's displayed
    if (toner && toner.length > 0) {
      setSearching(true);
    } else {
      // If no toner data, try to load it
      const cachedResults = loadFromCache();
      if (!cachedResults || cachedResults.length === 0) {
        getProducts(); // Reload products if needed
      }
    }
  };

  async function search() {
    try {
      setIsLoading(true);
      setProducts([]);
      setSearchResult([]);
      
      const searchTerm = inputData?.trim() || "";
      if (!searchTerm) {
        throw new Error('Empty search term');
      }
      
      console.log('Searching for:', searchTerm);
      
      // First check for cached data
      let accessToken = null;
      try {
        const tokenData = localStorage.getItem("token");
        if (tokenData) {
          const aToken = JSON.parse(tokenData);
          accessToken = aToken?.accessToken;
        }
      } catch (tokenError) {
        console.error('Token retrieval error:', tokenError);
      }
      
      if (!accessToken) {
        console.warn('No valid token found, trying to use context token');
        accessToken = token;
      }
      
      // Simplified search logic - first try local filter for immediate response
      if (toner && toner.length > 0) {
        console.log('Searching in local toner data');
        const localResults = toner.filter(product => {
          if (!product) return false;
          
          // Safe OEM check
          let oemMatch = false;
          if (product.oemNos && Array.isArray(product.oemNos)) {
            oemMatch = product.oemNos.some(oem => {
              return oem && oem.oemNo && 
                oem.oemNo.toLowerCase().includes(searchTerm.toLowerCase());
            });
          }
          
          // Safe title check
          let modelMatch = false;
          if (product.title && typeof product.title === 'string') {
            modelMatch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
          }
          
          return oemMatch || modelMatch;
        });
        
        if (localResults.length > 0) {
          console.log('Found matches in local data:', localResults.length);
          setSearchResult(localResults);
          setIsLoading(false);
          return;
        }
      }
      
      // If no local results or no local data, try API or fallback
      if (accessToken) {
        try {
          console.log('Fetching search results from API');
          const controller = new AbortController();
          const signal = controller.signal;
          
          const timeoutId = setTimeout(() => {
            controller.abort();
          }, 5000);
          
          const requestOptions = {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: accessToken,
              search: searchTerm
            }),
            signal
          };
          
          const response = await fetch('/api/products', requestOptions);
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const textResponse = await response.text();
          if (!textResponse || textResponse.trim() === '') {
            throw new Error('Empty API response');
          }
          
          const data = JSON.parse(textResponse);
          
          if (data?.cancel?.products && Array.isArray(data.cancel.products)) {
            const validProducts = data.cancel.products.filter(product => 
              product && 
              product.title && 
              product.oemNos && 
              Array.isArray(product.oemNos) && 
              product.oemNos.length > 0 &&
              product.serviceLevels && 
              Array.isArray(product.serviceLevels) && 
              product.serviceLevels.length > 0
            );
            
            if (validProducts.length > 0) {
              setSearchResult(validProducts);
              localStorage.setItem("last_search_results", JSON.stringify(validProducts));
            } else {
              throw new Error('No valid products in API response');
            }
          } else {
            throw new Error('No products in API response');
          }
        } catch (apiError) {
          console.error('API search failed:', apiError);
          // Continue to fallback handling below
        }
      }
      
      // If we get here, try fallback
      const fallbackResults = createSearchFallback(searchTerm);
      if (fallbackResults.length > 0) {
        setSearchResult(fallbackResults);
      } else {
        // If no results found, just show empty results
        setSearchResult([]);
      }
      
    } catch (err) {
      console.error('Search error:', err);
      setSearchResult([]);
    } finally {
      setIsLoading(false);
      setSearching(true);
    }
  }
  
  // Create search fallback data
  const createSearchFallback = (searchTerm) => {
    // Only create fallbacks for common Konica Minolta toner searches
    const term = searchTerm.toLowerCase();
    
    if (term.includes('tn-213') || term.includes('a0d7') || term.includes('bizhub c203')) {
      return [
        {
          id: "search1",
          title: `Konica Minolta TN-213K Black Toner (Search: ${searchTerm})`,
          oemNos: [{ oemNo: "A0D7152" }],
          serviceLevels: [{ price: 78.99 }],
          images: ["/static/toner-placeholder.webp"]
        }
      ];
    }
    
    if (term.includes('tn-214') || term.includes('a0d7') || term.includes('bizhub c364')) {
      return [
        {
          id: "search2",
          title: `Konica Minolta TN-214K Black Toner (Search: ${searchTerm})`,
          oemNos: [{ oemNo: "A0D7454" }],
          serviceLevels: [{ price: 84.99 }],
          images: ["/static/toner-placeholder.webp"]
        }
      ];
    }
    
    // Return empty array for unknown searches
    return [];
  };

  async function getProducts() {
    // First check if we have cached data and use it to avoid API calls that are failing
    const cachedResults = loadFromCache();
    if (cachedResults && cachedResults.length > 0) {
      console.log('Using cached products to avoid API errors');
      setSearching(true);
      setIsLoading(false);
      setToner(cachedResults);
      setProducts(cachedResults);
      return;
    }

    try {
      setIsLoading(true);
      let accessToken = null;

      try {
        const tokenData = localStorage.getItem("token");
        if (tokenData) {
          const aToken = JSON.parse(tokenData);
          accessToken = aToken?.accessToken;
        }
      } catch (tokenError) {
        console.error('Token retrieval error:', tokenError);
      }
      
      if (!accessToken) {
        console.warn('No valid token found in localStorage, trying to use context token');
        accessToken = token;
        
        if (!accessToken) {
          throw new Error('No authentication token available');
        }
      }

      console.log('Fetching initial products with token');
      const requestOptions = {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: accessToken, 
          search: "konica" 
        })
      };

      // Set a timeout to fallback to cached data if API is too slow
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API request timeout')), 5000);
      });

      try {
        // Race between the API request and timeout
        const response = await Promise.race([
          fetch('/api/products', requestOptions),
          timeoutPromise
        ]);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        let data;
        try {
          const textResponse = await response.text();
          if (!textResponse || textResponse.trim() === '') {
            console.warn('Empty response from API for initial products');
            throw new Error('Empty API response');
          }
          
          data = JSON.parse(textResponse);
        } catch (parseError) {
          console.error('JSON parse error in getProducts:', parseError);
          throw new Error('Invalid JSON response from server');
        }
        
        if (data?.cancel?.products && Array.isArray(data.cancel.products)) {
          // Further validate the products to ensure they have required properties
          const validProducts = data.cancel.products.filter(product => 
            product && 
            product.title && 
            product.oemNos && 
            Array.isArray(product.oemNos) && 
            product.oemNos.length > 0 &&
            product.serviceLevels && 
            Array.isArray(product.serviceLevels) && 
            product.serviceLevels.length > 0
          );
          
          if (validProducts.length > 0) {
            console.log('Initial products loaded:', validProducts.length);
            setSearching(true);
            localStorage.setItem("konica", JSON.stringify(validProducts));
            setProducts(validProducts);
            setToner(validProducts);
          } else {
            throw new Error('No valid products in API response');
          }
        } else {
          console.warn('No products found in API response');
          throw new Error('No products in API response');
        }
      } catch (apiError) {
        console.error('API request failed:', apiError);
        useFallbackData();
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      useFallbackData();
    } finally {
      setIsLoading(false);
    }
  }
  
  // Helper function to use fallback data
  const useFallbackData = () => {
    // Try to load from cache first
    const cachedData = loadFromCache();
    if (cachedData && cachedData.length > 0) {
      return;
    }
    
    // If no cache, create mock data as fallback
    console.log('Creating fallback data');
    const fallbackData = createFallbackData();
    setToner(fallbackData);
    setSearching(true);
    localStorage.setItem("konica", JSON.stringify(fallbackData));
  };

  // Helper function to load from cache
  const loadFromCache = () => {
    try {
      const cachedData = localStorage.getItem("konica");
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          console.log('Loaded cached products:', parsedData.length);
          setToner(parsedData);
          setSearching(true);
          return parsedData;
        }
      }
      return null;
    } catch (cacheErr) {
      console.error('Error loading cached data:', cacheErr);
      return null;
    }
  };
  
  // Create fallback data if everything else fails
  const createFallbackData = () => {
    return [
      {
        id: "km1",
        title: "Konica Minolta TN-213K Black Toner",
        oemNos: [{ oemNo: "A0D7152" }],
        serviceLevels: [{ price: 78.99 }],
        images: ["/static/toner-placeholder.webp"]
      },
      {
        id: "km2",
        title: "Konica Minolta TN-213C Cyan Toner",
        oemNos: [{ oemNo: "A0D7452" }],
        serviceLevels: [{ price: 89.99 }],
        images: ["/static/toner-placeholder.webp"]
      },
      {
        id: "km3",
        title: "Konica Minolta TN-213M Magenta Toner",
        oemNos: [{ oemNo: "A0D7352" }],
        serviceLevels: [{ price: 89.99 }],
        images: ["/static/toner-placeholder.webp"]
      },
      {
        id: "km4",
        title: "Konica Minolta TN-213Y Yellow Toner",
        oemNos: [{ oemNo: "A0D7252" }],
        serviceLevels: [{ price: 89.99 }],
        images: ["/static/toner-placeholder.webp"]
      }
    ];
  };

  useEffect(() => {    
    // Add a small delay to ensure token is loaded properly
    const initializeProducts = async () => {
      try {
        // Short delay to ensure token is loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        await getProducts();
      } catch (err) {
        console.error('Initialization error:', err);
      }
    };
    
    initializeProducts();
    
    // Add event listener for navigation clicks
    const handleNavClick = (e) => {
      // Check if the clicked element is the Konica navigation link
      if (e.target.textContent === 'Konica' || 
          e.target.closest('a')?.textContent === 'Konica') {
        resetToAllProducts();
      }
    };
    
    document.addEventListener('click', handleNavClick);
    
    // Clean up event listener
    return () => {
      document.removeEventListener('click', handleNavClick);
    };
  }, [token]);

  // This useEffect may be redundant now, as we're setting toner directly in getProducts
  // But keeping it for safety
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem("konica");
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          setSearching(true);
          setToner(parsedData);
        }
      }
    } catch (err) {
      console.error('Error loading cached konica data:', err);
    }
  }, []);

  // Extract model numbers from products
  const extractModelNumbers = (products) => {
    if (!products || !Array.isArray(products) || products.length === 0) {
      return [];
    }

    try {
      // Create a map to store unique models with their counts
      const modelMap = new Map();
      
      products.forEach(product => {
        if (!product || !product.title) return;
        
        // Try to extract model number from the title using regex
        // Look for patterns like bizhub C364, C554, 367, etc.
        const modelMatches = product.title.match(/\b(?:bizhub)?\s*(?:[A-Za-z])?\s*(\d+[A-Za-z]*)\b/i);
        
        if (modelMatches && modelMatches[0]) {
          const fullMatch = modelMatches[0].trim().toUpperCase();
          const model = fullMatch.includes('BIZHUB') ? fullMatch : `BIZHUB ${fullMatch}`;
          
          if (modelMap.has(model)) {
            modelMap.set(model, modelMap.get(model) + 1);
          } else {
            modelMap.set(model, 1);
          }
        }
      });

      // Convert map to array and sort alphabetically
      return Array.from(modelMap).sort((a, b) => a[0].localeCompare(b[0]));
    } catch (error) {
      console.error('Error extracting model numbers:', error);
      return [];
    }
  };

  // Group models by first letter for alphabetical display
  const groupModelsByLetter = (models) => {
    if (!models || !Array.isArray(models) || models.length === 0) {
      return [];
    }
    
    try {
      const groups = {};
      
      models.forEach(([model, count]) => {
        // Extract the first letter, defaulting to '#' for non-letter starts
        const firstChar = model.match(/[A-Z]/) ? model.match(/[A-Z]/)[0] : '#';
        
        if (!groups[firstChar]) {
          groups[firstChar] = [];
        }
        groups[firstChar].push([model, count]);
      });
      
      // Sort groups by letter
      return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    } catch (error) {
      console.error('Error grouping model numbers:', error);
      return [];
    }
  };

  // Display results based on search state
  const renderSearchResults = () => {
    if (isLoading) {
      return (
        <div className={styles.loaderContainer}>
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
      );
    }

    try {
      // Use search results if available, otherwise use toner data
      const productsToDisplay = searchResult && searchResult.length > 0 ? searchResult : toner;
      
      if (productsToDisplay && productsToDisplay.length > 0) {
        // Extract model numbers from products
        const modelNumbers = extractModelNumbers(productsToDisplay);
        
        if (modelNumbers.length === 0) {
          return (
            <div className={styles.emptyProductsContainer}>
              <div className={styles.nothing}>No model information found. Try another search.</div>
            </div>
          );
        }
        
        const groupedModels = groupModelsByLetter(modelNumbers);
        
        if (groupedModels.length === 0) {
          return (
            <div className={styles.emptyProductsContainer}>
              <div className={styles.nothing}>No models found with the search criteria.</div>
            </div>
          );
        }
        
        return (
          <div className={styles.modelListContainer}>
            {groupedModels.length > 1 && (
              <div className={styles.alphabetIndex}>
                {groupedModels.map(([letter, _]) => (
                  <a key={letter} href={`#letter-${letter}`} className={styles.indexLink}>
                    {letter}
                  </a>
                ))}
              </div>
            )}
            
            <div className={styles.modelGroups}>
              {groupedModels.map(([letter, models]) => (
                <div key={letter} id={`letter-${letter}`} className={styles.modelGroup}>
                  <h3 className={styles.groupTitle}>{letter}</h3>
                  <div className={styles.modelGrid}>
                    {models.map(([model, count]) => (
                      <div key={model} className={styles.modelCard}>
                        <h4 className={styles.modelName}>{model}</h4>
                        <p className={styles.suppliesCount}>{count} supplies available</p>
                        <Link 
                          href={`/modelSupplies?model=${encodeURIComponent(model.replace('BIZHUB ', ''))}`}
                          className={styles.viewSuppliesButton}
                        >
                          View Supplies
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    } catch (error) {
      console.error('Error rendering search results:', error);
    }
    
    // No results found
    return (
      <div className={styles.emptyProductsContainer}>
        <div className={styles.nothing}>No Models Found, Search Something Else</div>
      </div>
    );
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
              <div className={styles.searchContainer}>
                <input 
                  value={inputData || ''}
                  onChange={(event) => {
                    setInputData(event.target.value)
                    // If search field is cleared, reset to show all products
                    if (!event.target.value.trim()) {
                      resetToAllProducts();
                    }
                  }} 
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }} 
                  className={styles.search} 
                  placeholder="Search Konica Minolta"
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
                src="/static/Group.webp"
                alt="buy a used or new business copier"
                width={500}
                height={300}
              />
            </div>
          </div>
        </div>

        <section id={"toner"}></section>
        <div className={`${styles.center} ${styles.verticalStack}`}>
          <h2 className={styles.sectionHeader}>Choose Model</h2>
          {renderSearchResults()}
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
