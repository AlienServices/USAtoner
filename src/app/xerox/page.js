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

export default function XeroxPage() {
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
        // Extract models from all products
        const allModels = extractPrinterModels(toner);
        
        // Filter out part numbers that might have been mistakenly identified as models
        const filteredModels = allModels.filter(model => 
          model.model && 
          // Exclude common part number formats
          !/^[0-9]{3}[A-Z][0-9]{5}$/i.test(model.model) &&
          !/^[0-9]{4}-[0-9]{3}$/i.test(model.model)
        );
        
        if (filteredModels.length > 0) {
          const formattedModels = filteredModels.map(model => [
            model.model,
            {
              count: model.products?.length || 0,
              series: model.series || ''
            }
          ]);
          
          // Update printer models with all models
          setPrinterModels(formattedModels);
          setFilteredProducts(toner);
          setLoading(false);
        } else {
          // If no valid models were found, use the fallback generator
          console.log('No valid printer models found in reset, using fallback model generator');
          const fallbackModels = generateFallbackModels(toner);
          setPrinterModels(fallbackModels);
          setFilteredProducts(toner);
          setLoading(false);
        }
      } catch (modelError) {
        console.error('Error extracting models for reset:', modelError);
        
        // Use fallback model generator if extraction fails
        const fallbackModels = generateFallbackModels(toner);
        setPrinterModels(fallbackModels);
        setFilteredProducts(toner);
        setLoading(false);
      }
    } else {
      const cachedResults = loadFromCache();
      if (!cachedResults || cachedResults.length === 0) {
        getProducts();
      }
    }
  };

  async function search() {
    try {
      setError(null);
      
      const searchTerm = inputData?.trim() || "";
      if (!searchTerm) {
        resetToAllProducts();
        return;
      }
      
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
        accessToken = tonerOem;
      }
      
      // First try local filter for immediate response
      if (toner && toner.length > 0) {
        // Filter products by search term (look in titles and OEM numbers)
        const localResults = toner.filter(product => {
          if (!product) return false;
          
          // Check OEM numbers
          let oemMatch = false;
          if (product.oemNos && Array.isArray(product.oemNos)) {
            oemMatch = product.oemNos.some(oem => {
              return oem && oem.oemNo && 
                oem.oemNo.toLowerCase().includes(searchTerm.toLowerCase());
            });
          }
          
          // Check product title
          let titleMatch = false;
          if (product.title && typeof product.title === 'string') {
            titleMatch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
          }
          
          return oemMatch || titleMatch;
        });
        
        if (localResults.length > 0) {
          try {
            const models = extractPrinterModels(localResults);
            
            if (models.length > 0) {
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
            } else {
              // If no valid models were extracted but we have products, create fallback model references
              const fallbackModels = generateFallbackModels(localResults);
              if (fallbackModels.length > 0) {
                setPrinterModels(fallbackModels);
                setSearchResult(localResults);
                setLoading(false);
                return;
              }
            }
          } catch (modelError) {
            console.error('Error extracting models from search results:', modelError);
          }
        }
      }
      
      // If local filtering didn't work, use API
      if (accessToken) {
        setLoading(true);
        
        const requestOptions = {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: accessToken,
            search: `xerox ${searchTerm}`
          })
        };
        
        try {
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
            try {
              const apiModels = extractPrinterModels(products);
              const formattedModels = apiModels.map(model => [
                model.model,
                {
                  count: model.products?.length || 0,
                  series: model.series || ''
                }
              ]);
              
              setPrinterModels(formattedModels);
              setSearchResult(products);
              localStorage.setItem("last_search_results", JSON.stringify(products));
            } catch (modelError) {
              console.error('Error extracting models from API results:', modelError);
              setPrinterModels([]);
              setSearchResult([]);
            }
          } else {
            setPrinterModels([]);
            setSearchResult([]);
          }
        } catch (apiError) {
          console.error('API request failed:', apiError);
          setPrinterModels([]);
          setSearchResult([]);
          setError("Search failed: " + apiError.message);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setError("No authentication token available for search");
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchResult([]);
      setPrinterModels([]);
      setError(`Search error: ${err.message}`);
      setLoading(false);
    }
  }

  // Helper function to load from cache
  const loadFromCache = () => {
    try {
      const cachedData = localStorage.getItem("xerox");
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
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
        body: JSON.stringify({ token: aToken.accessToken, search: "xerox" })
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
                if (regularProducts && regularProducts.length > 0) break;
              }
            }
          }
        }
        
        // Tag products with source information
        if (regularProducts && Array.isArray(regularProducts)) {
          regularProducts = regularProducts.map(product => ({
            ...product,
            inventorySource: 'primary',
            inventoryName: 'Primary Inventory'
          }));
          console.log(`Found ${regularProducts.length} regular products`);
        } else {
          console.log("No regular products found in the response");
          regularProducts = [];
        }
      } catch (regularApiError) {
        console.error("Error fetching regular products:", regularApiError);
        // Continue with empty regularProducts array
        regularProducts = [];
      }
      
      // Now try to get DM API products
      let dmProducts = [];
      try {
        const dmResponse = await fetch('/api/dm-brand-products', {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ brand: "xerox" })
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
      
      // Combine both product sets - ensure both arrays are valid before combining
      const allProducts = [
        ...(Array.isArray(regularProducts) ? regularProducts : []), 
        ...(Array.isArray(dmProducts) ? dmProducts : [])
      ];
      
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
      localStorage.setItem("xerox", JSON.stringify(dedupedProducts));
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
    // Default fallback models in case we can't extract anything from products
    const defaultModels = [
      ["Phaser 3260", { count: 1, series: "Phaser" }],
      ["WorkCentre 3215", { count: 1, series: "WorkCentre" }],
      ["VersaLink C400", { count: 1, series: "VersaLink" }],
      ["AltaLink C8030", { count: 1, series: "AltaLink" }]
    ];
    
    // If no products, return the default models
    if (!products || !Array.isArray(products) || products.length === 0) {
      return defaultModels;
    }
    
    try {
      // Try to extract model info from product titles
      const modelMap = new Map();
      
      products.forEach(product => {
        if (!product || !product.title) return;
        
        const title = product.title.toUpperCase();
        
        // Common patterns for Xerox printer models
        const patterns = [
          /\bPHASER\s+([0-9]{4}[A-Z]?)\b/i,
          /\bWORKCENTRE\s+([0-9]{4}[A-Z]?)\b/i,
          /\bVERSALINK\s+([A-Z][0-9]{3}[A-Z]?)\b/i,
          /\bALTALINK\s+([A-Z][0-9]{4}[A-Z]?)\b/i
        ];
        
        let modelFound = false;
        
        // Check each pattern
        for (const pattern of patterns) {
          const match = title.match(pattern);
          if (match && match[1]) {
            const model = match[0]; // Use full match including series name
            
            // Determine series
            let series = "Other";
            if (title.includes("PHASER")) series = "Phaser";
            else if (title.includes("WORKCENTRE")) series = "WorkCentre";
            else if (title.includes("VERSALINK")) series = "VersaLink";
            else if (title.includes("ALTALINK")) series = "AltaLink";
            
            // Add to map or increment count
            if (modelMap.has(model)) {
              const data = modelMap.get(model);
              data.count++;
              modelMap.set(model, data);
            } else {
              modelMap.set(model, { count: 1, series });
            }
            
            modelFound = true;
            break;
          }
        }
        
        // If no model found in title, check OEM numbers
        if (!modelFound && product.oemNos && Array.isArray(product.oemNos)) {
          // Map of common Xerox part numbers to printer models
          const partToModelMap = {
            '106R02777': 'Phaser 3260',
            '106R03580': 'Phaser 3330',
            '106R02778': 'WorkCentre 3215',
            '106R03941': 'VersaLink B400'
          };
          
          for (const oem of product.oemNos) {
            if (!oem || !oem.oemNo) continue;
            
            const oemNo = oem.oemNo.toUpperCase();
            for (const [part, model] of Object.entries(partToModelMap)) {
              if (oemNo.includes(part)) {
                // Determine series
                let series = "Other";
                if (model.includes("Phaser")) series = "Phaser";
                else if (model.includes("WorkCentre")) series = "WorkCentre";
                else if (model.includes("VersaLink")) series = "VersaLink";
                else if (model.includes("AltaLink")) series = "AltaLink";
                
                // Add to map or increment count
                if (modelMap.has(model)) {
                  const data = modelMap.get(model);
                  data.count++;
                  modelMap.set(model, data);
                } else {
                  modelMap.set(model, { count: 1, series });
                }
                break;
              }
            }
          }
        }
      });
      
      // Convert map to array format
      const models = Array.from(modelMap).map(([model, data]) => [model, data]);
      
      // If we found any models, return them, otherwise return defaults
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
      // Make sure we have a valid model string
      if (!model || typeof model !== 'string') {
        console.error('Invalid model selected:', model);
        return;
      }
      
      // Clean up the model name for the URL
      const cleanModel = model.trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-zA-Z0-9-]/g, ''); // Remove special characters
      
      if (!cleanModel) {
        console.error('Invalid model after cleaning:', model);
        return;
      }
      
      // Store the selected model so we can highlight it when returning
      setSelectedModel(model);
      
      // Set local storage for recently viewed models
      try {
        const recentModels = JSON.parse(localStorage.getItem('recentXeroxModels') || '[]');
        // Add this model to the beginning of the array if it's not already the most recent
        if (recentModels[0] !== model) {
          // Remove this model from the array if it exists
          const filtered = recentModels.filter(m => m !== model);
          // Add it to the beginning
          filtered.unshift(model);
          // Keep only the 5 most recent models
          localStorage.setItem('recentXeroxModels', JSON.stringify(filtered.slice(0, 5)));
        }
      } catch (error) {
        console.error('Error updating recent models:', error);
      }
      
      // Navigate to the model supplies page
      router.push(`/xerox/modelSupplies?model=${encodeURIComponent(model)}`);
    } catch (error) {
      console.error('Error in handleModelSelect:', error);
      // Fallback to basic navigation if something went wrong
      router.push(`/xerox/modelSupplies?model=${encodeURIComponent(model || '')}`);
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
        // Extract the first letter, defaulting to '#' for non-letter starts
        let firstChar = '#';
        
        if (model && typeof model === 'string') {
          // Try to find the first letter of the model
          const match = model.match(/[A-Z]/i);
          if (match) {
            firstChar = match[0].toUpperCase();
          } else if (/^\d/.test(model)) {
            // If model starts with a number, use '#' group
            firstChar = '#';
          }
        }
        
        if (!groups[firstChar]) {
          groups[firstChar] = [];
        }
        groups[firstChar].push([model, modelData]);
      });
      
      // Sort groups by letter (with '#' at the end)
      return Object.entries(groups)
        .sort((a, b) => {
          // Put '#' at the end
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
    
    // Get inventory counts
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
    
    const groupedModels = groupModelsByLetter(printerModels);
    
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
                        href={`/xerox/modelSupplies?model=${encodeURIComponent(model)}`}
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
                  Xerox Supplies
                </div>
              </h1>
              <div className={styles.searchContainer}>
                <input 
                  value={inputData || ''}
                  onChange={(event) => {
                    setInputData(event.target.value);
                    if (!event.target.value.trim()) {
                      // If search is cleared, reset to show all products
                      resetToAllProducts();
                    } else if (event.target.value.trim().length > 2) {
                      // If 3 or more characters, perform real-time search
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
                  placeholder="Search Xerox"
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
                alt="Xerox printers and supplies"
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