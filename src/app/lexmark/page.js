"use client"
import React, { useState, useRef, useContext, useEffect, useMemo, useCallback } from "react";
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

export default function LexmarkPage() {
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

  // Function to handle search button click
  const handleSearch = () => {
    if (inputData && inputData.trim().length > 0) {
      window.location.replace('#toner');
      search();
    }
  };

  // Function to reset back to all products
  const resetToAllProducts = () => {
    setIsModelView(true);
    if (toner) {
      setFilteredProducts(filterProductsByOrigin(toner));
    }
  };

  // Function to filter products based on origin
  const filterProductsByOrigin = useCallback((products) => {
    if (!products || !Array.isArray(products)) {
      return [];
    }
    
    if (!originFilters.usaMade && !originFilters.americasMade && !originFilters.worldWideMade) {
      return products;
    }

    return products.filter(product => {
      if (!product) return false;
      
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
  }, [originFilters]);

  async function search() {
    setProducts();
    setSearching(true);
    setIsModelView(false);
    
    try {
      if (typeof window === 'undefined') return;
      
      let aToken;
      try {
        aToken = JSON.parse(localStorage.getItem("token"));
      } catch (error) {
        console.error("Error parsing token:", error);
        setError("Authentication error: Invalid token format");
        setLoading(false);
        return;
      }
      
      if (!aToken || !aToken.accessToken) {
        console.error("No valid token found");
        setError("Authentication error: No valid token found");
        setLoading(false);
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
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Search API Response:", JSON.stringify(data).substring(0, 200) + "...");
      
      // Extract products from the response based on different possible formats
      let products = [];
      
      if (data && typeof data === 'object') {
        if (data.cancel && Array.isArray(data.cancel.products)) {
          // Format: { cancel: { products: [...] } }
          products = data.cancel.products;
        } else if (data.products && Array.isArray(data.products)) {
          // Format: { products: [...] }
          products = data.products;
        } else if (Array.isArray(data)) {
          // Format: [...]
          products = data;
        } else if (data.data && Array.isArray(data.data)) {
          // Format: { data: [...] }
          products = data.data;
        } else if (data.results && Array.isArray(data.results)) {
          // Format: { results: [...] }
          products = data.results;
        } else {
          // Try to find any array in the response
          for (const key in data) {
            if (Array.isArray(data[key])) {
              products = data[key];
              break;
            } else if (data[key] && typeof data[key] === 'object') {
              for (const subKey in data[key]) {
                if (Array.isArray(data[key][subKey])) {
                  products = data[key][subKey];
                  break;
                }
              }
              if (products.length > 0) break;
            }
          }
        }
      }
      
      if (products.length === 0) {
        setSearchResult([]);
        setFilteredProducts([]);
        setError("No products found matching your search");
        return;
      }
      
      console.log(`Found ${products.length} products in search results`);
      
      const validProducts = products.filter(product => 
        product && typeof product === 'object'
      );
      
      setSearchResult(validProducts);
      setFilteredProducts(filterProductsByOrigin(validProducts));
    } catch (err) {
      console.error("Error searching products:", err);
      setError(err.message || "Failed to search products");
      setFilteredProducts([]);
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
        body: JSON.stringify({ token: aToken.accessToken, search: "lexmark" })
      };
      
      // Execute regular API request first
      let regularProducts = [];
      try {
        const regularResponse = await fetch('/api/products', requestOptions);
        
        if (!regularResponse.ok) {
          const errorText = await regularResponse.text();
          let errorMessage = `API error (${regularResponse.status}): ${errorText || regularResponse.statusText}`;
          
          // Check for token expiration
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.details?.message === "Token expired") {
              // Clear the expired token
              localStorage.removeItem("token");
              errorMessage = "Your session has expired. Please refresh the page to continue.";
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
        
        // Tag products with source information if we found any
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
        // Check if it's a token expiration error
        if (regularApiError.message.includes("session has expired")) {
          setError(regularApiError.message);
        } else {
          setError(`Failed to fetch products: ${regularApiError.message}`);
        }
        regularProducts = [];
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
          body: JSON.stringify({ brand: "lexmark" })
        });
        
        if (!dmResponse.ok) {
          const errorText = await dmResponse.text();
          throw new Error(`DM API error (${dmResponse.status}): ${errorText || dmResponse.statusText}`);
        }
        
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
      } catch (dmError) {
        console.error("Error processing DM products:", dmError);
        // Continue with empty dmProducts array
        dmProducts = [];
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
        setError("No products available at this time. Please try again later.");
        setLoading(false);
        return;
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
      localStorage.setItem("lexmark", JSON.stringify(dedupedProducts));
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

  useEffect(() => {
    try {
      getProducts();
    } catch (error) {
      console.error("Error in useEffect:", error);
      setError("Failed to initialize products");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const lexmarkData = localStorage.getItem("lexmark");
        if (lexmarkData) {
          const storedProducts = JSON.parse(lexmarkData);
          if (Array.isArray(storedProducts) && storedProducts.length > 0) {
            setToner(storedProducts);
            setSearching(true);
            
            try {
              const models = extractPrinterModels(storedProducts);
              if (models && models.length > 0) {
                setPrinterModels(models);
              }
            } catch (modelError) {
              console.error("Error extracting printer models:", modelError);
            }
            
            setFilteredProducts(filterProductsByOrigin(storedProducts));
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error loading stored products:", error);
      }
    }
  }, [products, filterProductsByOrigin]);

  useEffect(() => {
    if (searchResult) {
      setFilteredProducts(filterProductsByOrigin(searchResult));
    } else if (toner) {
      setFilteredProducts(filterProductsByOrigin(toner));
    }
  }, [searchResult, toner, filterProductsByOrigin]);

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
        const recentModels = JSON.parse(localStorage.getItem('recentLexmarkModels') || '[]');
        // Add this model to the beginning of the array if it's not already the most recent
        if (recentModels[0] !== model) {
          // Remove this model from the array if it exists
          const filtered = recentModels.filter(m => m !== model);
          // Add it to the beginning
          filtered.unshift(model);
          // Keep only the 5 most recent models
          localStorage.setItem('recentLexmarkModels', JSON.stringify(filtered.slice(0, 5)));
        }
      } catch (error) {
        console.error('Error updating recent models:', error);
      }
      
      // Navigate to the model supplies page
      router.push(`/lexmark/modelSupplies?model=${encodeURIComponent(model)}`);
    } catch (error) {
      console.error('Error in handleModelSelect:', error);
      // Fallback to basic navigation if something went wrong
      router.push(`/lexmark/modelSupplies?model=${encodeURIComponent(model || '')}`);
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

    try {
      // Use printerModels directly if available, otherwise extract models from products
      let modelNumbers = printerModels;
      
      if ((!modelNumbers || modelNumbers.length === 0) && (searchResult || toner)) {
        const productsToUse = searchResult && searchResult.length > 0 ? searchResult : toner;
        
        if (productsToUse && productsToUse.length > 0) {
          try {
            const extractedModels = extractPrinterModels(productsToUse);
            modelNumbers = extractedModels.map(model => [
              model.model,
              { count: model.products?.length || 0 }
            ]);
          } catch (extractError) {
            console.error('Error extracting models:', extractError);
          }
        }
      }
      
      if (!modelNumbers || modelNumbers.length === 0) {
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
                        <h4 className={styles.modelName}>{model.replace(/^Lexmark\s+/i, '')}</h4>
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
                          href={`/lexmark/modelSupplies?model=${encodeURIComponent(model)}`}
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
    } catch (error) {
      console.error('Error rendering search results:', error);
      return (
        <div className={styles.emptyProductsContainer}>
          <div className={styles.nothing}>Error displaying models. Please try again.</div>
        </div>
      );
    }
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
                  Lexmark Supplies
                </div>
              </h1>
              <div className={styles.searchContainer}>
                <input 
                  value={inputData || ''}
                  onChange={(event) => {
                    if (!event || !event.target) return;
                    
                    const newValue = event.target.value || '';
                    setInputData(newValue);
                    
                    if (!newValue.trim()) {
                      // If search is cleared, reset to show all products
                      resetToAllProducts();
                    } else if (newValue.trim().length > 2) {
                      // If 3 or more characters, perform real-time search
                      setSearching(true);
                      window.location.replace('#toner');
                      search();
                    }
                  }} 
                  onKeyDown={(e) => {
                    if (e && e.key === "Enter") {
                      handleSearch();
                    }
                  }} 
                  className={styles.search} 
                  placeholder="Search Lexmark"
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
                alt="Lexmark printers and supplies"
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
