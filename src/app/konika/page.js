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

export default function KonikaPage() {
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
          search: `konica minolta ${searchTerm}`
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
        body: JSON.stringify({ token: aToken.accessToken, search: "konica" })
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
        
        // Tag products with source information
        regularProducts = regularProducts.map(product => ({
          ...product,
          inventorySource: 'primary',
          inventoryName: 'Primary Inventory'
        }));
        
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
          body: JSON.stringify({ brand: "konica" })
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
                  // Tag DM products
                  dmProducts = dmData.data.products.map(product => ({
                    ...product,
                    inventorySource: 'distributorMarketplace',
                    inventoryName: 'Distributor Marketplace'
                  }));
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
      
      // Create a function to deduplicate products
      const deduplicateProducts = (products) => {
        const uniqueProductsMap = new Map();
        
        // First pass - add all products with source info
        products.forEach(product => {
          // Generate a key using OEM number if available or title
          const oemKey = product.oemNos && product.oemNos[0] && product.oemNos[0].oemNo 
            ? product.oemNos[0].oemNo.toUpperCase()
            : null;
            
          const titleKey = product.title ? product.title.toUpperCase().replace(/\s+/g, '') : null;
          const key = oemKey || titleKey || product.id;
          
          if (!key) return; // Skip if no usable key
          
          // If product doesn't exist in map or comes from primary source, add/update it
          if (!uniqueProductsMap.has(key) || product.inventorySource === 'primary') {
            uniqueProductsMap.set(key, {
              ...product,
              sourceCount: {
                primary: product.inventorySource === 'primary' ? 1 : 0,
                distributorMarketplace: product.inventorySource === 'distributorMarketplace' ? 1 : 0
              },
              totalQuantity: product.quantity || 1
            });
          } else {
            // Product exists but from secondary source, update counts only
            const existingProduct = uniqueProductsMap.get(key);
            existingProduct.sourceCount[product.inventorySource] = 
              (existingProduct.sourceCount[product.inventorySource] || 0) + 1;
            existingProduct.totalQuantity += (product.quantity || 1);
          }
        });
        
        return Array.from(uniqueProductsMap.values());
      };
      
      // Combine both product sets
      const allProducts = [...regularProducts, ...dmProducts];
      
      if (allProducts.length === 0) {
        throw new Error("No products found in API responses");
      }
      
      // Filter for valid products and deduplicate
      const validProducts = allProducts.filter(product => {
        return product && 
               typeof product === 'object';
      });
      
      const dedupedProducts = deduplicateProducts(validProducts);
      
      if (dedupedProducts.length === 0) {
        throw new Error("No valid products found in response");
      }
      
      setSearching(true);
      localStorage.setItem("konika", JSON.stringify(dedupedProducts));
      setProducts(dedupedProducts);
      
      const models = extractPrinterModels(dedupedProducts);
      setPrinterModels(models);
      setFilteredProducts(dedupedProducts);
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
      ["Bizhub C360", { count: 1, series: "Bizhub" }],
      ["Bizhub 454e", { count: 1, series: "Bizhub" }],
      ["Magicolor 4650", { count: 1, series: "Magicolor" }],
      ["PagePro 1350", { count: 1, series: "PagePro" }]
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
        
        // Common patterns for Konica Minolta printer models
        const patterns = [
          /\bBIZHUB\s+([A-Z]?[0-9]+[a-z]*(?:-[0-9]+[a-z]*)?)\b/i,
          /\bMAGICOLOR\s+([0-9]+[a-z]*(?:-[0-9]+[a-z]*)?)\b/i,
          /\bPAGEPRO\s+([0-9]+[a-z]*(?:-[0-9]+[a-z]*)?)\b/i,
          /\bKONICA\s+MINOLTA\s+([A-Z]?[0-9]+[a-z]*(?:-[0-9]+[a-z]*)?)\b/i
        ];
        
        // Check each pattern
        for (const pattern of patterns) {
          const match = title.match(pattern);
          if (match && match[0]) {
            const model = match[0];
            
            // Determine series
            let series = "Other";
            if (model.includes("BIZHUB")) series = "Bizhub";
            else if (model.includes("MAGICOLOR")) series = "Magicolor";
            else if (model.includes("PAGEPRO")) series = "PagePro";
            else series = "Konica Minolta";
            
            // Add to map or increment count
            if (modelMap.has(model)) {
              modelMap.get(model).count++;
            } else {
              modelMap.set(model, { count: 1, series });
            }
          }
        }
        
        // Also check OEM numbers for model clues
        if (product.oemNos && Array.isArray(product.oemNos)) {
          product.oemNos.forEach(oemObj => {
            if (!oemObj || !oemObj.oemNo) return;
            
            const oemNo = oemObj.oemNo.toUpperCase();
            
            // Extract model info from OEM number (e.g., TN-321K for Bizhub C224)
            if (oemNo.startsWith("TN-") || oemNo.startsWith("TNP") || oemNo.startsWith("A0")) {
              // Add as a generic Konica model if we can't map it to a specific printer
              const genericModel = `Konica Minolta ${oemNo}`;
              
              if (!modelMap.has(genericModel)) {
                modelMap.set(genericModel, { count: 1, series: "Konica Minolta" });
              } else {
                modelMap.get(genericModel).count++;
              }
            }
          });
        }
      });
      
      // Check if we found enough models
      const models = Array.from(modelMap.entries()).map(([model, data]) => [model, data]);
      
      // If we found some models but less than our default set, supplement with defaults
      if (models.length > 0 && models.length < 4) {
        return [...models, ...defaultModels.slice(0, 4 - models.length)];
      }
      
      // If we found enough models, return them, otherwise return defaults
      return models.length > 0 ? models : defaultModels;
    } catch (error) {
      console.error('Error generating fallback models:', error);
      return defaultModels;
    }
  };

  useEffect(() => {
    try {
      // Check local storage first
      const savedToner = localStorage.getItem("konika");
      if (savedToner) {
        try {
          const parsedToner = JSON.parse(savedToner);
          if (Array.isArray(parsedToner) && parsedToner.length > 0) {
            setToner(parsedToner);
            
            // Extract models from saved products
            const models = extractPrinterModels(parsedToner);
            if (models && models.length > 0) {
              setPrinterModels(models);
              setFilteredProducts(parsedToner);
              setLoading(false);
              return;
            }
          }
        } catch (parseError) {
          console.error("Error parsing saved toner data:", parseError);
          // Continue to fetch new data if parsing fails
        }
      }
      
      // If no valid data in localStorage, fetch from API
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
        const recentModels = JSON.parse(localStorage.getItem('recentKonikaModels') || '[]');
        if (recentModels[0] !== model) {
          const filtered = recentModels.filter(m => m !== model);
          filtered.unshift(model);
          localStorage.setItem('recentKonikaModels', JSON.stringify(filtered.slice(0, 5)));
        }
      } catch (error) {
        console.error('Error updating recent models:', error);
      }
      
      // Navigate to the model supplies page
      router.push(`/konika/modelSupplies?model=${encodeURIComponent(model)}`);
    } catch (error) {
      console.error('Error in handleModelSelect:', error);
      router.push(`/konika/modelSupplies?model=${encodeURIComponent(model || '')}`);
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
    
    // Get total inventory counts
    const inventoryCounts = {
      primary: 0,
      distributorMarketplace: 0
    };
    
    if (filteredProducts && filteredProducts.length > 0) {
      filteredProducts.forEach(product => {
        if (product.sourceCount) {
          inventoryCounts.primary += (product.sourceCount.primary || 0);
          inventoryCounts.distributorMarketplace += (product.sourceCount.distributorMarketplace || 0);
        } else if (product.inventorySource) {
          inventoryCounts[product.inventorySource] += 1;
        }
      });
    }
    
    return (
      <>
        <div className={styles.inventorySummary}>
          <div className={styles.inventoryStats}>
            <div className={styles.inventorySource}>
              <span className={styles.inventoryName}>Primary Inventory:</span>
              <span className={styles.inventoryCount}>{inventoryCounts.primary}</span>
            </div>
            <div className={styles.inventorySource}>
              <span className={styles.inventoryName}>Distributor Marketplace:</span>
              <span className={styles.inventoryCount}>{inventoryCounts.distributorMarketplace}</span>
            </div>
            <div className={styles.inventorySource}>
              <span className={styles.inventoryName}>Total Unique Products:</span>
              <span className={styles.inventoryCount}>{filteredProducts.length}</span>
            </div>
          </div>
        </div>
        
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
                      <p className={styles.suppliesCount}>
                        {modelData.count} supplies available
                        {modelData.inventorySources && (
                          <span className={styles.inventorySourceBadges}>
                            {modelData.inventorySources.primary > 0 && 
                              <span className={styles.primaryBadge} title="Primary Inventory">P:{modelData.inventorySources.primary}</span>
                            }
                            {modelData.inventorySources.distributorMarketplace > 0 && 
                              <span className={styles.dmBadge} title="Distributor Marketplace">DM:{modelData.inventorySources.distributorMarketplace}</span>
                            }
                          </span>
                        )}
                      </p>
                      <Link 
                        href={`/konika/modelSupplies?model=${encodeURIComponent(model)}`}
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
      </>
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
                  Konica Minolta Supplies
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
                alt="Konica Minolta printers and supplies"
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
