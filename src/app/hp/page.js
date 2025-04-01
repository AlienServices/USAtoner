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
  const [searching, setSearching] = useState(true);
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
          // Exclude HP toner part numbers (typically CF###X, CE###X, etc.)
          !/^(CF|CE|CC)[0-9]{3}[A-Z]?$/i.test(model.model) &&
          // Exclude other common part number formats
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
          // Extract models from the filtered products
          try {
            const filteredModels = extractPrinterModels(localResults);
            
            // Ensure we're getting valid printer models, not part numbers
            const validModels = filteredModels.filter(model => 
              model.model && 
              // Filter out part numbers that made it through
              !/^(CF|CE|CC)[0-9]{3}[A-Z]?$/i.test(model.model) && 
              !/^[0-9]{4}-[0-9]{3}$/i.test(model.model)
            );
            
            if (validModels.length > 0) {
              const formattedModels = validModels.map(model => [
                model.model,
                {
                  count: model.products?.length || 0,
                  series: model.series || ''
                }
              ]);
              
              // Update printer models with the filtered results
              setPrinterModels(formattedModels);
              setSearchResult(localResults);
              setLoading(false);
              return;
            } else {
              console.log('No valid printer models found in search results, but found products');
              
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
        } else {
          // No local results found
          setPrinterModels([]);
          setSearchResult([]);
          setLoading(false);
          return;
        }
      }
      
      // If no local results or no cached products, try API
      if (accessToken) {
        setLoading(true);
        
        const requestOptions = {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: accessToken,
            search: searchTerm
          })
        };
        
        try {
          const response = await fetch('/api/products', requestOptions);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          // Check for different response formats
          let products = [];
          
          if (data.cancel && Array.isArray(data.cancel.products)) {
            products = data.cancel.products;
          } else if (data.products && Array.isArray(data.products)) {
            products = data.products;
          } else if (Array.isArray(data)) {
            products = data;
          } else {
            // Try to extract products from any array property in the response
            try {
              const arrayProps = Object.entries(data)
                .filter(([_, value]) => Array.isArray(value) && value.length > 0)
                .map(([_, value]) => value);
              
              if (arrayProps && arrayProps.length > 0) {
                // Use the largest array found
                const largestArray = arrayProps.reduce((a, b) => a.length > b.length ? a : b, []);
                if (largestArray && largestArray.length > 0) {
                  products = largestArray;
                  console.log("Found product array in alternative location", largestArray.length);
                }
              }
            } catch (arrayError) {
              console.error("Error extracting arrays from response:", arrayError);
              console.log("Response data structure:", JSON.stringify(Object.keys(data)));
              // Continue with empty regularProducts array
            }
          }
          
          const validProducts = products.filter(product => 
            product && 
            product.title && 
            (
              (product.oemNos && Array.isArray(product.oemNos) && product.oemNos.length > 0) ||
              (product.oemNo && typeof product.oemNo === 'string')
            ) &&
            (
              (product.serviceLevels && Array.isArray(product.serviceLevels) && product.serviceLevels.length > 0) ||
              (typeof product.price === 'number' && product.price > 0)
            )
          );
          
          if (validProducts.length > 0) {
            // Extract models from the API results
            try {
              const apiModels = extractPrinterModels(validProducts);
              const formattedModels = apiModels.map(model => [
                model.model,
                {
                  count: model.products?.length || 0,
                  series: model.series || ''
                }
              ]);
              
              setPrinterModels(formattedModels);
              setSearchResult(validProducts);
              localStorage.setItem("last_search_results", JSON.stringify(validProducts));
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
      const cachedData = localStorage.getItem("hp");
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
        const tokenData = localStorage.getItem("token");
        if (!tokenData) {
          throw new Error("No token found in localStorage");
        }
        aToken = JSON.parse(tokenData);
        if (!aToken?.accessToken) {
          throw new Error("Invalid token format");
        }
      } catch (error) {
        console.error("Error parsing token:", error);
        setError("Failed to load authentication token");
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
      
      // Create parallel requests for regular API and DM API
      let regularResponse;
      try {
        regularResponse = await fetch('/api/products', requestOptions);
        
        if (!regularResponse.ok) {
          console.error("HTTP error fetching products:", regularResponse.status, regularResponse.statusText);
          throw new Error(`HTTP error! status: ${regularResponse.status}`);
        }
      } catch (fetchError) {
        console.error("Network error fetching products:", fetchError);
        // Attempt to load from cache if available
        const cachedProducts = loadFromCache();
        if (cachedProducts && cachedProducts.length > 0) {
          console.log("Using cached products due to fetch error");
          // Process cached products
          try {
            setProducts(cachedProducts);
            setFilteredProducts(cachedProducts);
            
            // Process model data from cached products
            processProductModels(cachedProducts);
          } catch (cacheProcessError) {
            console.error("Error processing cached products:", cacheProcessError);
            setError("Error processing cached products: " + cacheProcessError.message);
          }
          setLoading(false);
          return;
        }
        throw new Error(`Network error: ${fetchError.message}`);
      }
      
      // Process regular products
      let regularProducts = [];
      try {
        const textResponse = await regularResponse.text();
        if (!textResponse || textResponse.trim() === '') {
          throw new Error("Empty response from API");
        }
        const data = JSON.parse(textResponse);
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error("Invalid response format: not an object");
        }
        
        // Check for different response formats
        try {
          if (data.cancel && Array.isArray(data.cancel.products)) {
            // Standard format
            regularProducts = data.cancel.products;
          } else if (data.products && Array.isArray(data.products)) {
            // Alternative format 1
            regularProducts = data.products;
          } else if (Array.isArray(data)) {
            // Alternative format 2 - direct array
            regularProducts = data;
          } else {
            // Try to extract products from any array property in the response
            try {
              const arrayProps = Object.entries(data)
                .filter(([_, value]) => Array.isArray(value) && value.length > 0)
                .map(([_, value]) => value);
              
              if (arrayProps && arrayProps.length > 0) {
                // Use the largest array found
                const largestArray = arrayProps.reduce((a, b) => a.length > b.length ? a : b, []);
                if (largestArray && largestArray.length > 0) {
                  regularProducts = largestArray;
                  console.log("Found product array in alternative location", largestArray.length);
                }
              }
            } catch (arrayError) {
              console.error("Error extracting arrays from response:", arrayError);
              console.log("Response data structure:", JSON.stringify(Object.keys(data)));
              // Continue with empty regularProducts array
            }
          }
        } catch (formatError) {
          console.error("Error processing response format:", formatError);
          throw new Error("Failed to extract products from response: " + formatError.message);
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
          regularProducts = [];
          console.log("No regular products found after processing");
        }
      } catch (error) {
        console.error("Error parsing regular response:", error);
        regularProducts = [];
        throw new Error("Failed to parse server response");
      }
      
      // Process DM products
      let dmProducts = [];
      try {
        const dmResponse = await fetch('/api/dm-brand-products', {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ brand: "hp" })
        });
        
        if (dmResponse && dmResponse.ok) {
          try {
            const dmResponseText = await dmResponse.text();
            
            if (!dmResponseText || dmResponseText.trim() === '') {
              console.warn("DM API returned empty response");
            } else {
              try {
                const dmData = JSON.parse(dmResponseText);
                console.log("DM API Response:", JSON.stringify(dmData).substring(0, 200) + "...");
                
                if (dmData && dmData.success && dmData.data) {
                  if (Array.isArray(dmData.data.products)) {
                    dmProducts = dmData.data.products.map(product => ({
                      ...product,
                      inventorySource: 'distributorMarketplace',
                      inventoryName: 'Distributor Marketplace'
                    }));
                    console.log(`Found ${dmProducts.length} DM products`);
                  } else {
                    console.warn("DM API response has no products array:", 
                      dmData.data ? Object.keys(dmData.data).join(', ') : 'no data object');
                  }
                } else {
                  console.warn("DM API response missing expected structure");
                }
              } catch (jsonError) {
                console.error("Error parsing DM response JSON:", jsonError);
                console.log("Raw DM response:", dmResponseText.substring(0, 200) + "...");
              }
            }
          } catch (dmError) {
            console.error("Error processing DM products:", dmError);
            // Continue with regular products even if DM fails
          }
        } else {
          console.error(`DM API responded with status: ${dmResponse?.status || 'unknown'}`);
        }
      } catch (dmFetchError) {
        console.error("Network error fetching DM products:", dmFetchError);
        // Continue with regular products only
      }
      
      // Create a function to deduplicate products
      const deduplicateProducts = (products) => {
        const uniqueProductsMap = new Map();
        
        // First pass - add all products with source info
        products.forEach(product => {
          if (!product) return;
          
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
      
      // Combine both product sets - ensure both are valid arrays
      const combinedProducts = [
        ...(Array.isArray(regularProducts) ? regularProducts : []), 
        ...(Array.isArray(dmProducts) ? dmProducts : [])
      ];
      
      // Filter and validate products
      let validProducts = [];
      try {
        validProducts = combinedProducts.filter(product => {
          if (!product || typeof product !== 'object') return false;
          
          // Basic validation
          return true;
        });
        
        const dedupedProducts = deduplicateProducts(validProducts);
        
        if (dedupedProducts.length === 0) {
          // Try to load from cache as fallback
          const cachedProducts = loadFromCache();
          if (cachedProducts && cachedProducts.length > 0) {
            console.log("Using cached products as no valid products found in API response");
            setProducts(cachedProducts);
            setFilteredProducts(cachedProducts);
            // Process model data
            processProductModels(cachedProducts);
            setLoading(false);
            return;
          }
          throw new Error("No valid products found in API responses");
        }
        
        // Save to cache for future use
        try {
          localStorage.setItem("hp", JSON.stringify(dedupedProducts));
        } catch (cacheError) {
          console.error("Error saving products to cache:", cacheError);
        }
        
        // Update state
        setProducts(dedupedProducts);
        
        // Process model data
        processProductModels(dedupedProducts);
        
        setFilteredProducts(dedupedProducts);
      } catch (validationError) {
        console.error("Error validating products:", validationError);
        throw new Error("Failed to process products: " + validationError.message);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message || "Failed to fetch products");
      
      // Load fallback data as a last resort
      try {
        const fallbackData = [
          {
            id: "emergency-fallback-1",
            title: "HP LaserJet Pro M402 Black Toner Cartridge",
            oemNos: [{ oemNo: "CF226A" }],
            serviceLevels: [{ price: 79.99 }],
            images: ["/static/toner-placeholder.webp"]
          },
          {
            id: "emergency-fallback-2",
            title: "HP LaserJet Pro M402 Imaging Drum",
            oemNos: [{ oemNo: "CF232A" }],
            serviceLevels: [{ price: 99.99 }],
            images: ["/static/toner-placeholder.webp"]
          }
        ];
        
        setProducts(fallbackData);
        setToner(fallbackData);
        setPrinterModels([["M402", { count: 2, series: "LaserJet" }]]);
        setFilteredProducts(fallbackData);
      } catch (emergencyFallbackError) {
        console.error("Even emergency fallback failed:", emergencyFallbackError);
      }
    } finally {
      setLoading(false);
    }
  }
  
  // Helper function to extract printer models from product data
  const extractPrinterModels = (products) => {
    if (!products || !Array.isArray(products) || products.length === 0) {
      return [];
    }
    
    try {
      // Map to store unique models with their products
      const modelMap = new Map();
      
      // Process each product to extract model information
      products.forEach(product => {
        if (!product || !product.title) return;
        
        const title = product.title.toUpperCase();
        
        // Define patterns to extract HP printer models from title
        const patterns = [
          { regex: /\bM([0-9]{3,4}[a-z]*)\b/i, series: 'LaserJet' },         // M402, M477, etc.
          { regex: /\bP([0-9]{3,4}[a-z]*)\b/i, series: 'LaserJet' },         // P2035, etc.
          { regex: /\bCP([0-9]{3,4}[a-z]*)\b/i, series: 'LaserJet' },        // CP1025, etc.
          { regex: /LASERJET\s+([0-9]{3,4}[a-z]*)\b/i, series: 'LaserJet' },  // LaserJet 1020, etc.
          { regex: /OFFICEJET\s+(?:PRO\s+)?([0-9]{3,4}[a-z]*)\b/i, series: 'OfficeJet' }, // OfficeJet 8720, OfficeJet Pro 9015, etc.
          { regex: /DESKJET\s+([0-9]{3,4}[a-z]*)\b/i, series: 'DeskJet' },    // DeskJet 2755, etc.
          { regex: /ENVY\s+([0-9]{3,4}[a-z]*)\b/i, series: 'ENVY' }          // ENVY 6055, etc.
        ];
        
        // Try to match patterns in the title
        let modelFound = false;
        
        for (const pattern of patterns) {
          const match = title.match(pattern.regex);
          if (match && match[1]) {
            const modelNumber = match[1];
            
            // Avoid part numbers being treated as models (CF283A, etc.)
            if (/^(CF|CE|CC)[0-9]{3}[A-Z]?$/i.test(modelNumber)) continue;
            
            // Add model to map or update existing entry
            if (!modelMap.has(modelNumber)) {
              modelMap.set(modelNumber, {
                model: modelNumber,
                series: pattern.series,
                products: [product]
              });
            } else {
              const existing = modelMap.get(modelNumber);
              if (!existing.products.some(p => p.id === product.id)) {
                existing.products.push(product);
              }
            }
            
            modelFound = true;
            break; // Found a match, no need to check other patterns
          }
        }
        
        // If no model found in title, check OEM numbers for known mappings
        if (!modelFound && product.oemNos && Array.isArray(product.oemNos)) {
          // Map common HP toner part numbers to printer models
          const partToModelMap = {
            'CF217A': { model: 'M102', series: 'LaserJet' },
            'CF217X': { model: 'M102', series: 'LaserJet' },
            'CF226A': { model: 'M402', series: 'LaserJet' },
            'CF226X': { model: 'M402', series: 'LaserJet' },
            'CF228A': { model: 'M403', series: 'LaserJet' },
            'CF228X': { model: 'M403', series: 'LaserJet' },
            'CF230A': { model: 'M203', series: 'LaserJet' },
            'CF230X': { model: 'M203', series: 'LaserJet' },
            'CF258A': { model: 'M404', series: 'LaserJet' },
            'CF258X': { model: 'M404', series: 'LaserJet' },
            'CF259A': { model: 'M304', series: 'LaserJet' },
            'CF259X': { model: 'M304', series: 'LaserJet' },
            'CF276A': { model: 'M404', series: 'LaserJet' },
            'CF276X': { model: 'M404', series: 'LaserJet' },
            'CF279A': { model: 'M12', series: 'LaserJet' },
            'CF280A': { model: 'M401', series: 'LaserJet' },
            'CF280X': { model: 'M401', series: 'LaserJet' },
            'CF283A': { model: 'M127', series: 'LaserJet' },
            'CF283X': { model: 'M127', series: 'LaserJet' },
            'CF400A': { model: 'M277', series: 'LaserJet' },
            'CF400X': { model: 'M277', series: 'LaserJet' },
            'CF410A': { model: 'M452', series: 'LaserJet' },
            'CF410X': { model: 'M452', series: 'LaserJet' },
            'CF500A': { model: 'M254', series: 'LaserJet' },
            'CF500X': { model: 'M254', series: 'LaserJet' },
            '65': { model: '5055', series: 'ENVY' },
            '65XL': { model: '5055', series: 'ENVY' },
            '67': { model: '2755', series: 'DeskJet' },
            '67XL': { model: '2755', series: 'DeskJet' },
            '910': { model: '8025', series: 'OfficeJet' },
            '910XL': { model: '8025', series: 'OfficeJet' },
            '962': { model: '9015', series: 'OfficeJet' },
            '962XL': { model: '9015', series: 'OfficeJet' }
          };
          
          for (const oem of product.oemNos) {
            if (!oem || !oem.oemNo) continue;
            
            const oemNo = oem.oemNo.toUpperCase();
            
            // Check if this OEM number matches any known part number
            for (const [partNumber, modelInfo] of Object.entries(partToModelMap)) {
              if (oemNo.includes(partNumber)) {
                const { model: modelNumber, series } = modelInfo;
                
                // Add model to map or update existing entry
                if (!modelMap.has(modelNumber)) {
                  modelMap.set(modelNumber, {
                    model: modelNumber,
                    series: series,
                    products: [product]
                  });
                } else {
                  const existing = modelMap.get(modelNumber);
                  if (!existing.products.some(p => p.id === product.id)) {
                    existing.products.push(product);
                  }
                }
                
                break; // Found a match, no need to check other parts
              }
            }
          }
        }
      });
      
      // Convert map to array
      return Array.from(modelMap.values());
    } catch (error) {
      console.error('Error extracting printer models:', error);
      return [];
    }
  };
  
  // Helper function to process product models
  const processProductModels = (products) => {
    try {
      // Make sure the models are extracted properly
      const models = extractPrinterModels(products);
      
      // Filter out part numbers that might have been mistakenly identified as models
      const filteredModels = models.filter(model => 
        model.model && 
        // Exclude HP toner part numbers (typically CF###X, CE###X, etc.)
        !/^(CF|CE|CC)[0-9]{3}[A-Z]?$/i.test(model.model) &&
        // Exclude other common part number formats
        !/^[0-9]{4}-[0-9]{3}$/i.test(model.model)
      );
      
      if (filteredModels.length > 0) {
        // Ensure models are in the proper format for grouping
        const formattedModels = filteredModels.map(model => {
          return [
            model.model, 
            { 
              count: model.products?.length || 0,
              series: model.series || ''
            }
          ];
        });
        
        setPrinterModels(formattedModels);
        setFilteredProducts(products);
      } else {
        // If no valid models were found, create fallback models
        console.log('No valid printer models extracted from products, creating fallbacks');
        const fallbackModels = generateFallbackModels(products);
        setPrinterModels(fallbackModels);
        setFilteredProducts(products);
      }
    } catch (modelError) {
      console.error("Error extracting printer models:", modelError);
      
      // Create fallback model groupings
      const fallbackModels = generateFallbackModels(products);
      setPrinterModels(fallbackModels);
      setFilteredProducts(products);
    }
  };

  // Helper function to generate fallback models when extraction fails
  const generateFallbackModels = (products) => {
    // Default fallback models in case we can't extract anything from products
    const defaultModels = [
      ["M402", { count: 1, series: "LaserJet" }],
      ["M404", { count: 1, series: "LaserJet" }],
      ["M428", { count: 1, series: "LaserJet" }],
      ["M452", { count: 1, series: "LaserJet" }],
      ["9015", { count: 1, series: "OfficeJet" }],
      ["8035", { count: 1, series: "OfficeJet" }],
      ["2755", { count: 1, series: "DeskJet" }]
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
        
        // Common patterns for HP printer models
        const patterns = [
          /\bM([0-9]{3,4}[A-Z]?)\b/, // LaserJet M402, M404dn, etc.
          /\b([0-9]{4}[A-Z]?)\b/,    // 2755, 8035, etc.
          /LASERJET\s+([0-9]{3,4}[A-Z]?)\b/, // LaserJet 1020, etc.
          /OFFICEJET\s+([0-9]{3,4}[A-Z]?)\b/, // OfficeJet 8035, etc.
          /DESKJET\s+([0-9]{3,4}[A-Z]?)\b/, // DeskJet 2755, etc.
        ];
        
        let modelFound = false;
        
        // Check each pattern
        for (const pattern of patterns) {
          const match = title.match(pattern);
          if (match && match[1]) {
            const model = match[1];
            
            // Determine series
            let series = "LaserJet";
            if (title.includes("OFFICEJET")) series = "OfficeJet";
            else if (title.includes("DESKJET")) series = "DeskJet";
            else if (title.includes("ENVY")) series = "ENVY";
            
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
          // Map of common HP toner part numbers to printer models
          const partToModelMap = {
            'CF217A': 'M102',
            'CF217X': 'M102',
            'CF230A': 'M203',
            'CF230X': 'M203',
            'CF279A': 'M12',
            'CF283A': 'M125',
            'CF283X': 'M125',
            'CF400A': 'M277',
            'CF410A': 'M452',
            'CF500A': 'M254'
          };
          
          for (const oem of product.oemNos) {
            if (!oem || !oem.oemNo) continue;
            
            const oemNo = oem.oemNo.toUpperCase();
            for (const [part, model] of Object.entries(partToModelMap)) {
              if (oemNo.includes(part)) {
                // Add to map or increment count
                if (modelMap.has(model)) {
                  const data = modelMap.get(model);
                  data.count++;
                  modelMap.set(model, data);
                } else {
                  modelMap.set(model, { count: 1, series: "LaserJet" });
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
        const recentModels = JSON.parse(localStorage.getItem('recentHPModels') || '[]');
        // Add this model to the beginning of the array if it's not already the most recent
        if (recentModels[0] !== model) {
          // Remove this model from the array if it exists
          const filtered = recentModels.filter(m => m !== model);
          // Add it to the beginning
          filtered.unshift(model);
          // Keep only the 5 most recent models
          localStorage.setItem('recentHPModels', JSON.stringify(filtered.slice(0, 5)));
        }
      } catch (error) {
        console.error('Error updating recent models:', error);
      }
      
      // Navigate to the model supplies page
      router.push(`/hp/modelSupplies?model=${encodeURIComponent(model)}`);
    } catch (error) {
      console.error('Error in handleModelSelect:', error);
      // Fallback to basic navigation if something went wrong
      router.push(`/hp/modelSupplies?model=${encodeURIComponent(model || '')}`);
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
                        href={`/hp/modelSupplies?model=${encodeURIComponent(model)}`}
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
                  HP Supplies
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
                  placeholder="Search HP"
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
                alt="HP printers and supplies"
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
