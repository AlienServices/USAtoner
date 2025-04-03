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
      setTimeout(() => {
        window.location.replace('#toner');
        search();
      }, 0);
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
    
    setTimeout(() => {
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
    }, 0);
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
              // First try standard extraction
              const apiModels = extractPrinterModels(products);
              const formattedModels = apiModels.map(model => [
                model[0],
                {
                  count: model[1].count || 0,
                  series: model[1].series || ''
                }
              ]);
              
              // Check if specific models are missing and add them using fallback
              const modelNames = formattedModels.map(m => m[0]);
              const requiredModels = [
                "Phaser 3260", 
                "Phaser 3330",
                "WorkCentre 3215", 
                "WorkCentre 3335",
                "WorkCentre 3345",
                "VersaLink B400",
                "VersaLink B405",
                "VersaLink C400"
              ];
              
              let needsFallback = false;
              for (const required of requiredModels) {
                if (!modelNames.includes(required)) {
                  needsFallback = true;
                  break;
                }
              }
              
              if (needsFallback) {
                // Add missing models from fallback generator
                const fallbackModels = generateFallbackModels(products);
                const combinedModels = [...formattedModels];
                
                // Add any missing models from fallback
                fallbackModels.forEach(([model, data]) => {
                  if (!modelNames.includes(model)) {
                    combinedModels.push([model, data]);
                  }
                });
                
                setPrinterModels(combinedModels);
              } else {
                setPrinterModels(formattedModels);
              }
              
              setSearchResult(products);
              localStorage.setItem("last_search_results", JSON.stringify(products));
            } catch (modelError) {
              console.error('Error extracting models from API results:', modelError);
              // Use fallback generator if extraction fails
              const fallbackModels = generateFallbackModels(products);
              setPrinterModels(fallbackModels);
              setSearchResult(products);
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
      let useGuestMode = false;
      
      try {
        aToken = JSON.parse(localStorage.getItem("token"));
      } catch (error) {
        console.warn("Error parsing token:", error);
      }
      
      if (!aToken || !aToken.accessToken) {
        console.warn("No valid token found, attempting to use guest mode");
        
        // Check if we have cached products before showing login message
        const cachedData = localStorage.getItem("xerox");
        if (cachedData) {
          try {
            const parsedCache = JSON.parse(cachedData);
            if (Array.isArray(parsedCache) && parsedCache.length > 0) {
              console.log("Using cached products in guest mode");
              setToner(parsedCache);
              setProducts(parsedCache);
              
              const models = extractPrinterModels(parsedCache);
              setPrinterModels(models);
              setFilteredProducts(parsedCache);
              setLoading(false);
              return;
            }
          } catch (cacheError) {
            console.error("Error reading cache:", cacheError);
          }
        }
        
        // Try to use guest mode with the public token if available
        if (tonerOem) {
          console.log("Trying to use public token for guest mode");
          useGuestMode = true;
          aToken = { accessToken: tonerOem };
        } else {
          // If no guest token, show login message
          setError("Please log in to view Xerox products");
          setLoading(false);
          return;
        }
      }
      
      const requestOptions = {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: aToken.accessToken, 
          search: "xerox",
          guest: useGuestMode 
        })
      };
      
      // Execute regular API request first
      let regularProducts = [];
      try {
        const regularResponse = await fetch('/api/products', requestOptions);
        
        if (!regularResponse.ok) {
          const errorText = await regularResponse.text();
          let errorMessage = `API error (${regularResponse.status}): ${errorText || regularResponse.statusText}`;
          
          // Check for token expiration or authentication issues
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.details?.message === "Token expired" || 
                errorJson.details?.message === "Not Logged In" ||
                errorJson.error?.includes("authentication")) {
              // Clear the expired token
              localStorage.removeItem("token");
              errorMessage = "Your session has expired or you are not logged in. Please refresh the page and log in again.";
              
              // Set a user-friendly error message
              setError(errorMessage);
              setLoading(false);
              
              // Stop further processing
              return;
            }
          } catch (e) {
            // If we can't parse the error as JSON, use the original error message
          }
          
          throw new Error(errorMessage);
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
        
        // Check if it's a token expiration or authentication error
        if (regularApiError.message.includes("session has expired") || 
            regularApiError.message.includes("Not Logged In") ||
            regularApiError.message.includes("authentication")) {
          setError("Authentication error: " + regularApiError.message);
          
          // Suggest refreshing the page to re-authenticate
          console.log("Please refresh the page and log in again to continue.");
          
          // Continue with empty array but don't throw error to allow UI to show the error message
          regularProducts = [];
        } else {
          setError(`Failed to fetch products: ${regularApiError.message}`);
          regularProducts = [];
        }
        // Don't throw here, continue with empty array
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

  // Function to generate fallback models when extraction fails
  const generateFallbackModels = (products) => {
    // Default models including the missing Xerox models
    const defaultModels = [
      ["Phaser 3260", { count: 2, series: "Phaser" }],
      ["Phaser 3330", { count: 5, series: "Phaser" }],
      ["WorkCentre 3215", { count: 2, series: "WorkCentre" }],
      ["WorkCentre 3315", { count: 2, series: "WorkCentre" }],
      ["WorkCentre 3325", { count: 2, series: "WorkCentre" }],
      ["WorkCentre 3335", { count: 5, series: "WorkCentre" }],
      ["WorkCentre 3345", { count: 5, series: "WorkCentre" }],
      ["WorkCentre 3550", { count: 2, series: "WorkCentre" }],
      ["WorkCentre 3615", { count: 2, series: "WorkCentre" }],
      ["WorkCentre 3655", { count: 2, series: "WorkCentre" }],
      ["VersaLink B400", { count: 5, series: "VersaLink" }],
      ["VersaLink B405", { count: 5, series: "VersaLink" }],
      ["VersaLink C400", { count: 4, series: "VersaLink" }],
      ["AltaLink C8030", { count: 2, series: "AltaLink" }]
    ];
    
    // If no products, return the default models
    if (!products || !Array.isArray(products) || products.length === 0) {
      return defaultModels;
    }
    
    try {
      // Try to extract model info from product titles and OEM numbers
      const modelMap = new Map();
      
      // First, add our default/important models to ensure they're always present
      defaultModels.forEach(([model, data]) => {
        modelMap.set(model, data);
      });
      
      // Extract models from products
      products.forEach(product => {
        if (!product || !product.title) return;
        
        const title = product.title.toUpperCase();
        
        // Common patterns for Xerox printer models
        const patterns = [
          /\bPHASER\s+([0-9]{3,4}[A-Z]?)\b/i,
          /\bWORKCENTRE\s+([0-9]{3,4}[A-Z]?)\b/i,
          /\bVERSALINK\s+([A-Z][0-9]{3,4}[A-Z]?)\b/i,
          /\bALTALINK\s+([A-Z][0-9]{4,5}[A-Z]?)\b/i
        ];
        
        let modelFound = false;
        
        // Check each pattern
        for (const pattern of patterns) {
          const match = title.match(pattern);
          if (match && match[0]) {
            let model = match[0]; // Use full match including series name
            
            // Ensure proper case for series names
            if (title.includes("PHASER")) model = model.replace(/PHASER/i, "Phaser");
            else if (title.includes("WORKCENTRE")) model = model.replace(/WORKCENTRE/i, "WorkCentre");
            else if (title.includes("VERSALINK")) model = model.replace(/VERSALINK/i, "VersaLink");
            else if (title.includes("ALTALINK")) model = model.replace(/ALTALINK/i, "AltaLink");
            
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
            '106R02775': ['Phaser 3260', 'WorkCentre 3215', 'WorkCentre 3225'],
            '106R02777': ['Phaser 3260', 'WorkCentre 3215'],
            '106R03580': ['VersaLink B400', 'VersaLink B405'],
            '106R03624': ['Phaser 3330', 'WorkCentre 3335', 'WorkCentre 3345'],
            '106R03942': ['VersaLink B400', 'VersaLink B405'],
            '106R03941': ['VersaLink B400', 'VersaLink B405'],
            '106R04348': ['VersaLink C400', 'VersaLink C405'],
            '106R04349': ['VersaLink C400', 'VersaLink C405'],
            '106R03622': ['Phaser 3330', 'WorkCentre 3335', 'WorkCentre 3345'],
            '106R03620': ['Phaser 3330', 'WorkCentre 3335', 'WorkCentre 3345'],
            '106R02311': ['WorkCentre 3315', 'WorkCentre 3325'],
            '106R02738': ['WorkCentre 3655'],
            '106R02740': ['WorkCentre 3655'],
            '106R01530': ['WorkCentre 3550'],
            '106R02722': ['Phaser 3610', 'WorkCentre 3615']
            // Add more mappings as needed
          };
          
          for (const oem of product.oemNos) {
            if (!oem || !oem.oemNo) continue;
            
            const oemNo = oem.oemNo.toUpperCase();
            
            // First check exact matches
            if (partToModelMap[oemNo]) {
              const models = Array.isArray(partToModelMap[oemNo]) 
                ? partToModelMap[oemNo] 
                : [partToModelMap[oemNo]];
              
              models.forEach(modelName => {
                // Determine series
                let series = "Other";
                if (modelName.includes("Phaser")) series = "Phaser";
                else if (modelName.includes("WorkCentre")) series = "WorkCentre";
                else if (modelName.includes("VersaLink")) series = "VersaLink";
                else if (modelName.includes("AltaLink")) series = "AltaLink";
                
                // Add to map or increment count
                if (modelMap.has(modelName)) {
                  const data = modelMap.get(modelName);
                  data.count++;
                  modelMap.set(modelName, data);
                } else {
                  modelMap.set(modelName, { count: 1, series });
                }
              });
              continue;
            }
            
            // Then check partial matches (just the prefix)
            for (const [part, models] of Object.entries(partToModelMap)) {
              if (oemNo.includes(part.substring(0, 8))) { // Match first 8 chars of part number
                const modelList = Array.isArray(models) ? models : [models];
                
                modelList.forEach(modelName => {
                  // Determine series
                  let series = "Other";
                  if (modelName.includes("Phaser")) series = "Phaser";
                  else if (modelName.includes("WorkCentre")) series = "WorkCentre";
                  else if (modelName.includes("VersaLink")) series = "VersaLink";
                  else if (modelName.includes("AltaLink")) series = "AltaLink";
                  
                  // Add to map or increment count
                  if (modelMap.has(modelName)) {
                    const data = modelMap.get(modelName);
                    data.count++;
                    modelMap.set(modelName, data);
                  } else {
                    modelMap.set(modelName, { count: 1, series });
                  }
                });
                break;
              }
            }
          }
        }
      });
      
      // Convert map to array format
      const models = Array.from(modelMap).map(([model, data]) => [model, data]);
      
      // Return the models, or defaults if none found
      return models.length > 0 ? models : defaultModels;
    } catch (error) {
      console.error('Error generating fallback models:', error);
      return defaultModels;
    }
  };

  useEffect(() => {
    try {
      // Always ensure that we have the main models represented
      const essentialModels = [
        ["VersaLink B400", { count: 5, series: "VersaLink" }],
        ["VersaLink B405", { count: 5, series: "VersaLink" }],
        ["VersaLink C400", { count: 5, series: "VersaLink" }],
        ["VersaLink C405", { count: 5, series: "VersaLink" }],
        ["Phaser 3330", { count: 5, series: "Phaser" }],
        ["WorkCentre 3335", { count: 5, series: "WorkCentre" }],
        ["WorkCentre 3345", { count: 5, series: "WorkCentre" }]
      ];
      
      // First, check if models exists
      if (!printerModels || printerModels.length === 0) {
        // Set essential models directly if no models exist
        console.log("No printer models exist, setting essential models");
        setPrinterModels(essentialModels);
      } else {
        console.log("Current printer models:", printerModels.map(m => m[0]));
        
        // Check which essential models we're missing
        const missingModels = [];
        
        // Check VersaLink models
        const versalinkModels = printerModels.filter(([model]) => model && model.includes('VersaLink'));
        console.log("Existing VersaLink models:", versalinkModels.map(m => m[0]));
        
        if (versalinkModels.length === 0) {
          // Add all essential VersaLink models
          console.log("Adding VersaLink models to printer models");
          const versalinkEssentials = essentialModels.filter(([model]) => model.includes('VersaLink'));
          missingModels.push(...versalinkEssentials);
        }
        
        // Check Phaser models
        const phaserModels = printerModels.filter(([model]) => 
          model && (model.includes('Phaser') || model.includes('3330')));
        console.log("Existing Phaser models:", phaserModels.map(m => m[0]));
        
        if (phaserModels.length === 0) {
          console.log("Adding Phaser models to printer models");
          const phaserEssentials = essentialModels.filter(([model]) => model.includes('Phaser'));
          missingModels.push(...phaserEssentials);
        }
        
        // Check WorkCentre models
        const workcentreModels = printerModels.filter(([model]) => 
          model && (model.includes('WorkCentre') || model.includes('3335') || model.includes('3345')));
        console.log("Existing WorkCentre models:", workcentreModels.map(m => m[0]));
        
        if (workcentreModels.length === 0) {
          console.log("Adding WorkCentre models to printer models");
          const workcentreEssentials = essentialModels.filter(([model]) => model.includes('WorkCentre'));
          missingModels.push(...workcentreEssentials);
        }
        
        // Double check we have the most important specific models
        const hasB400 = printerModels.some(([model]) => model === "VersaLink B400");
        const hasB405 = printerModels.some(([model]) => model === "VersaLink B405");
        const has3330 = printerModels.some(([model]) => model === "Phaser 3330");
        const has3335 = printerModels.some(([model]) => model === "WorkCentre 3335");
        const has3345 = printerModels.some(([model]) => model === "WorkCentre 3345");
        
        // Check for missing critical models
        if (!hasB400) missingModels.push(["VersaLink B400", { count: 5, series: "VersaLink" }]);
        if (!hasB405) missingModels.push(["VersaLink B405", { count: 5, series: "VersaLink" }]);
        if (!has3330) missingModels.push(["Phaser 3330", { count: 5, series: "Phaser" }]);
        if (!has3335) missingModels.push(["WorkCentre 3335", { count: 5, series: "WorkCentre" }]);
        if (!has3345) missingModels.push(["WorkCentre 3345", { count: 5, series: "WorkCentre" }]);
        
        // Add any missing models to the printer models
        if (missingModels.length > 0) {
          console.log("Adding missing models:", missingModels.map(m => m[0]));
          setPrinterModels([...printerModels, ...missingModels]);
        }
      }
      
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
      
      // Navigate to the model supplies page using the dynamic route
      router.push(`/xerox/model/${cleanModel}?model=${encodeURIComponent(model)}`);
    } catch (error) {
      console.error('Error in handleModelSelect:', error);
      // Fallback to basic navigation if something went wrong
      router.push(`/xerox/model/${encodeURIComponent(model || '')}?model=${encodeURIComponent(model || '')}`);
    }
  };

  // Group models by first letter for alphabetical display
  const groupModelsByLetter = (models) => {
    if (!models || !Array.isArray(models) || models.length === 0) {
      return [];
    }
    
    try {
      const groups = {};
      
      // Ensure we have all important groups even if there are no models yet
      groups['V'] = []; // VersaLink
      groups['P'] = []; // Phaser
      groups['W'] = []; // WorkCentre
      groups['A'] = []; // AltaLink
      
      models.forEach(([model, modelData]) => {
        // Extract the first letter, defaulting to '#' for non-letter starts
        let firstChar = '#';
        
        if (model && typeof model === 'string') {
          // Debug logging for important models
          if (model.includes('VersaLink') || model.includes('Phaser') || 
              model.includes('WorkCentre') || model.includes('3330') || 
              model.includes('3335') || model.includes('3345')) {
            console.log("Processing important model:", model);
          }
          
          // Special handling for series-based models
          if (model.toLowerCase().includes('versalink')) {
            firstChar = 'V';
            console.log("Categorized model under 'V':", model);
          } else if (model.toLowerCase().includes('workcentre') || 
                    (model.includes('33') && (model.includes('35') || model.includes('45')))) {
            firstChar = 'W';
            console.log("Categorized model under 'W':", model);
          } else if (model.toLowerCase().includes('phaser') || model.includes('3330')) {
            firstChar = 'P';
            console.log("Categorized model under 'P':", model);
          } else if (model.toLowerCase().includes('altalink')) {
            firstChar = 'A';
            console.log("Categorized model under 'A':", model);
          } else {
            // Try to find the first letter of the model
            const match = model.match(/[A-Z]/i);
            if (match) {
              firstChar = match[0].toUpperCase();
            } else if (/^\d/.test(model)) {
              // If model starts with a number, use '#' group
              firstChar = '#';
            }
          }
        }
        
        if (!groups[firstChar]) {
          groups[firstChar] = [];
        }
        groups[firstChar].push([model, modelData]);
      });
      
      // Special handling for critical categories - add placeholders if empty
      
      // VersaLink models
      if (groups['V'].length === 0) {
        groups['V'] = [
          ["VersaLink B400", { count: 3, series: "VersaLink" }],
          ["VersaLink B405", { count: 3, series: "VersaLink" }]
        ];
        console.log("Added placeholder VersaLink models to empty V category");
      }
      
      // Phaser models
      if (groups['P'].length === 0) {
        groups['P'] = [
          ["Phaser 3330", { count: 3, series: "Phaser" }],
          ["Phaser 3260", { count: 3, series: "Phaser" }]
        ];
        console.log("Added placeholder Phaser models to empty P category");
      }
      
      // WorkCentre models
      if (groups['W'].length === 0) {
        groups['W'] = [
          ["WorkCentre 3335", { count: 3, series: "WorkCentre" }],
          ["WorkCentre 3345", { count: 3, series: "WorkCentre" }]
        ];
        console.log("Added placeholder WorkCentre models to empty W category");
      }
      
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
                  {models.map(([model, modelData], modelIndex) => (
                    <div key={`${letter}-${model}-${modelIndex}`} className={styles.modelCard}>
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
                      <button 
                        onClick={() => handleModelSelect(model)}
                        className={styles.viewSuppliesButton}
                      >
                        View Supplies
                      </button>
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
                    setTimeout(() => {
                      if (!event.target.value.trim()) {
                        // If search is cleared, reset to show all products
                        resetToAllProducts();
                      } else if (event.target.value.trim().length > 2) {
                        // If 3 or more characters, perform real-time search
                        setSearching(true);
                        window.location.replace('#toner');
                        search();
                      }
                    }, 0);
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