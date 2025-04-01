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
import OriginFilter from "../components/OriginFilter";

export default function DellPage() {
  const { cart, setCart, tonerOem } = useContext(CartContext);
  const [inputData, setInputData] = useState('');
  const [searching, setSearching] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchResult, setSearchResult] = useState();
  const [toner, setToner] = useState();
  const [printerModels, setPrinterModels] = useState([]);
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

  const handleSearch = () => {
    if (inputData && inputData.trim()) {
      setSearching(true);
      setLoading(true);
      window.location.replace('#toner');
      search();
    } else {
      resetToAllProducts();
    }
  };

  // Function to reset search and show all products
  const resetToAllProducts = () => {
    setSearching(true);
    setSearchResult(null);
    setInputData('');
    setError(null);
    
    if (toner && toner.length > 0) {
      try {
        // Extract models from products
        const models = extractPrinterModels(toner);
        if (models.length > 0) {
          const formattedModels = models.map(model => [
            model.model,
            {
              count: model.products?.length || 0,
              series: model.series || ''
            }
          ]);
          
          setPrinterModels(formattedModels);
          setFilteredProducts(toner);
          setLoading(false);
        } else {
          // Fallback if no models found
          const fallbackModels = generateFallbackModels(toner);
          setPrinterModels(fallbackModels);
          setFilteredProducts(toner);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error extracting models:', error);
        setLoading(false);
      }
    } else {
      getProducts();
    }
  };

  async function search() {
    try {
      const searchTerm = inputData?.trim() || "";
      if (!searchTerm) {
        resetToAllProducts();
        return;
      }
      
      // Try local filter first
      if (toner && toner.length > 0) {
        const localResults = toner.filter(product => {
          // Check title and OEM numbers
          return (product.title && product.title.toLowerCase().includes(searchTerm.toLowerCase())) || 
                 (product.oemNos && product.oemNos.some(oem => 
                    oem.oemNo && oem.oemNo.toLowerCase().includes(searchTerm.toLowerCase())
                 ));
        });
        
        if (localResults.length > 0) {
          const models = extractPrinterModels(localResults);
          const formattedModels = models.map(model => [
            model.model,
            {
              count: model.products?.length || 0,
              series: model.series || ''
            }
          ]);
          
          setPrinterModels(formattedModels);
          setSearchResult(localResults);
          setLoading(false);
          return;
        }
      }
      
      // If local search fails, try API
      const tokenData = localStorage.getItem("token");
      if (!tokenData) {
        setError("Authentication token not available");
        setLoading(false);
        return;
      }
      
      const aToken = JSON.parse(tokenData);
      const requestOptions = {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: aToken.accessToken,
          search: `dell ${searchTerm}`
        })
      };
      
      const response = await fetch('/api/products', requestOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract products from response
      let products = [];
      if (data.cancel && Array.isArray(data.cancel.products)) {
        products = data.cancel.products;
      } else if (data.products && Array.isArray(data.products)) {
        products = data.products;
      } else if (Array.isArray(data)) {
        products = data;
      }
      
      if (products.length > 0) {
        const models = extractPrinterModels(products);
        const formattedModels = models.map(model => [
          model.model,
          {
            count: model.products?.length || 0,
            series: model.series || ''
          }
        ]);
        
        setPrinterModels(formattedModels);
        setSearchResult(products);
      } else {
        setPrinterModels([]);
        setSearchResult([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
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
        body: JSON.stringify({ token: aToken.accessToken, search: "dell" })
      };
      
      // Execute regular API request first
      let regularProducts = [];
      try {
        const regularResponse = await fetch('/api/products', requestOptions);
        
        if (!regularResponse.ok) {
          throw new Error(`HTTP error! status: ${regularResponse.status}`);
        }
        
        // Process regular products
        const data1 = await regularResponse.json();
        console.log("Regular API Response:", JSON.stringify(data1).substring(0, 200) + "...");
        
        // Extract regular products
        if (data1 && typeof data1 === 'object') {
          if (data1.cancel && Array.isArray(data1.cancel.products)) {
            regularProducts = data1.cancel.products;
          } else if (data1.products && Array.isArray(data1.products)) {
            regularProducts = data1.products;
          } else if (Array.isArray(data1)) {
            regularProducts = data1;
          } else if (data1.data && Array.isArray(data1.data)) {
            regularProducts = data1.data;
          } else if (data1.results && Array.isArray(data1.results)) {
            regularProducts = data1.results;
          } else {
            // Try to find any array in the response
            for (const key in data1) {
              if (Array.isArray(data1[key])) {
                regularProducts = data1[key];
                break;
              } else if (data1[key] && typeof data1[key] === 'object') {
                for (const subKey in data1[key]) {
                  if (Array.isArray(data1[key][subKey])) {
                    regularProducts = data1[key][subKey];
                    break;
                  }
                }
                if (regularProducts.length > 0) break;
              }
            }
          }
        }
        
        console.log(`Found ${regularProducts.length} regular products`);
      } catch (regularApiError) {
        console.error("Error fetching regular products:", regularApiError);
        // Continue with empty regularProducts array
      }
      
      // Now try to get DM API products
      let dmProducts = [];
      try {
        const dmResponse = await fetch('/api/dm-brand-products', {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ brand: "dell" })
        });
        
        if (dmResponse.ok) {
          try {
            const dmResponseText = await dmResponse.text();
            
            if (!dmResponseText || dmResponseText.trim() === '') {
              console.warn("DM API returned empty response");
            } else {
              try {
                const dmData = JSON.parse(dmResponseText);
                console.log("DM API Response:", JSON.stringify(dmData).substring(0, 200) + "...");
                
                if (dmData && dmData.success && dmData.data && Array.isArray(dmData.data.products)) {
                  dmProducts = dmData.data.products;
                  console.log(`Found ${dmProducts.length} DM products`);
                } else {
                  console.warn("DM API response has no products array", 
                    dmData.data ? Object.keys(dmData.data).join(', ') : 'no data object');
                }
              } catch (jsonError) {
                console.error("Error parsing DM response JSON:", jsonError);
              }
            }
          } catch (textError) {
            console.error("Error getting text from DM response:", textError);
          }
        } else {
          console.error(`DM API responded with status: ${dmResponse.status}`);
        }
      } catch (dmError) {
        console.error("Error processing DM products:", dmError);
        // Continue with empty dmProducts array
      }
      
      // Combine both product sets
      const allProducts = [...regularProducts, ...dmProducts];
      
      if (allProducts.length === 0) {
        throw new Error("No products found in API responses");
      }
      
      // Filter for valid products
      const validProducts = allProducts.filter(product => {
        return product && 
               typeof product === 'object';
      });
      
      if (validProducts.length === 0) {
        throw new Error("No valid products found in response");
      }
      
      setSearching(true);
      localStorage.setItem("dell", JSON.stringify(validProducts));
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

  // Helper function to generate fallback models when extraction fails
  const generateFallbackModels = (products) => {
    const defaultModels = [
      ["B2360", { count: 1, series: "B Series" }],
      ["B3460", { count: 1, series: "B Series" }],
      ["C2660", { count: 1, series: "C Series" }],
      ["E515", { count: 1, series: "E Series" }]
    ];
    
    if (!products || products.length === 0) {
      return defaultModels;
    }
    
    try {
      // Extract model info from product titles
      const modelMap = new Map();
      
      products.forEach(product => {
        if (!product || !product.title) return;
        
        const title = product.title.toUpperCase();
        
        // Common patterns for Dell printer models
        const patterns = [
          /\bB([0-9]{4}[A-Z]?)\b/i,
          /\bC([0-9]{4}[A-Z]?)\b/i,
          /\bE([0-9]{3}[A-Z]?)\b/i,
          /\bH([0-9]{3}[A-Z]?)\b/i
        ];
        
        // Check each pattern
        for (const pattern of patterns) {
          const match = title.match(pattern);
          if (match && match[0]) {
            const model = match[0];
            
            // Determine series
            let series = "Other";
            if (model.startsWith("B")) series = "B Series";
            else if (model.startsWith("C")) series = "C Series";
            else if (model.startsWith("E")) series = "E Series";
            else if (model.startsWith("H")) series = "H Series";
            
            // Add to map or increment count
            if (modelMap.has(model)) {
              modelMap.get(model).count++;
            } else {
              modelMap.set(model, { count: 1, series });
            }
          }
        }
      });
      
      // Convert map to array format
      const models = Array.from(modelMap.entries()).map(([model, data]) => [model, data]);
      
      // If models were found, return them, otherwise return defaults
      return models.length > 0 ? models : defaultModels;
    } catch (error) {
      console.error('Error generating fallback models:', error);
      return defaultModels;
    }
  };

  useEffect(() => {
    try {
      getProducts();
    } catch (error) {
      console.error("Error in useEffect:", error);
      setError("Failed to initialize products");
    }
  }, []);

  useEffect(() => {
    if (searchResult) {
      setFilteredProducts(filterProductsByOrigin(searchResult));
    } else if (toner) {
      setFilteredProducts(filterProductsByOrigin(toner));
    }
  }, [originFilters, searchResult, toner]);

  const handleModelSelect = (model) => {
    try {
      if (!model) return;
      
      // Store the selected model
      setSelectedModel(model);
      
      // Set local storage for recently viewed models
      try {
        const recentModels = JSON.parse(localStorage.getItem('recentDellModels') || '[]');
        if (recentModels[0] !== model) {
          const filtered = recentModels.filter(m => m !== model);
          filtered.unshift(model);
          localStorage.setItem('recentDellModels', JSON.stringify(filtered.slice(0, 5)));
        }
      } catch (error) {
        console.error('Error updating recent models:', error);
      }
      
      // Navigate to the model supplies page
      router.push(`/dell/modelSupplies?model=${encodeURIComponent(model)}`);
    } catch (error) {
      console.error('Error in handleModelSelect:', error);
      router.push(`/dell/modelSupplies?model=${encodeURIComponent(model || '')}`);
    }
  };

  // Group models by first letter for alphabetical display
  const groupModelsByLetter = (models) => {
    if (!models || !Array.isArray(models) || models.length === 0) {
      return [];
    }
    
    try {
      const groups = {};
      
      models.forEach(([model, modelData]) => {
        // Get first letter or '#' for non-alphabetic starts
        let firstChar = model && typeof model === 'string' && /^[A-Z]/i.test(model) 
          ? model[0].toUpperCase() 
          : '#';
        
        if (!groups[firstChar]) {
          groups[firstChar] = [];
        }
        groups[firstChar].push([model, modelData]);
      });
      
      // Sort groups
      return Object.entries(groups).sort((a, b) => {
        if (a[0] === '#') return 1;
        if (b[0] === '#') return -1;
        return a[0].localeCompare(b[0]);
      });
    } catch (error) {
      console.error('Error grouping model numbers:', error);
      return [];
    }
  };

  // Display results based on search state
  const renderSearchResults = () => {
    if (loading) {
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

    if (error) {
      return (
        <div className={styles.emptyProductsContainer}>
          <div className={styles.nothing}>Error loading models: {error}</div>
        </div>
      );
    }

    if (!printerModels || printerModels.length === 0) {
      return (
        <div className={styles.emptyProductsContainer}>
          <div className={styles.nothing}>No model information found. Try another search.</div>
        </div>
      );
    }
    
    const groupedModels = groupModelsByLetter(printerModels);
    
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
                {models.map(([model, modelData]) => (
                  <div key={model} className={styles.modelCard}>
                    <h4 className={styles.modelName}>{model}</h4>
                    <p className={styles.suppliesCount}>{modelData.count} supplies available</p>
                    <Link 
                      href={`/dell/modelSupplies?model=${encodeURIComponent(model)}`}
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
                  Dell Supplies
                </div>
              </h1>
              <div className={styles.searchContainer}>
                <input 
                  value={inputData || ''}
                  onChange={(event) => {
                    setInputData(event.target.value);
                    if (!event.target.value.trim()) {
                      resetToAllProducts();
                    } else if (event.target.value.trim().length > 2) {
                      setSearching(true);
                      window.location.replace('#toner');
                      search();
                    }
                  }} 
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }} 
                  className={styles.search} 
                  placeholder="Search Dell"
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
                alt="Dell printers and supplies"
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
      </div>
      <Footer />
    </div>
  );
}
