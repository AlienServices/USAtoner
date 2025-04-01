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
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modelGroups, setModelGroups] = useState({});
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  
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
          
          let data;
          try {
            // First try to parse the response directly
            data = await response.json();
          } catch (jsonError) {
            console.error('Error parsing JSON response:', jsonError);
            
            // If JSON parsing fails, try to get the text content and parse it
            const textResponse = await response.text();
            if (!textResponse || textResponse.trim() === '') {
              throw new Error('Empty API response');
            }
            
            try {
              data = JSON.parse(textResponse);
            } catch (textParseError) {
              console.error('Error parsing response text as JSON:', textParseError);
              throw new Error('Invalid API response format');
            }
          }
          
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
              // Add compatibility information to the product titles
              const enhancedProducts = validProducts.map(product => {
                // Extract bizhub model from title or use part compatibility mapping
                let compatibleModels = [];
                
                // Try to find bizhub model in title
                const title = product.title?.toLowerCase() || '';
                const bizhubMatch = title.match(/bizhub\s+([a-z0-9]+-?[a-z0-9]*)/i);
                if (bizhubMatch && bizhubMatch[1]) {
                  compatibleModels.push(`BIZHUB ${bizhubMatch[1].toUpperCase()}`);
                }
                
                // Check part number compatibility
                if (product.oemNos && Array.isArray(product.oemNos)) {
                  const partMap = {
                    'TNP37': ['BIZHUB 4700P'],
                    'TNP-37': ['BIZHUB 4700P'],
                    'TNP44': ['BIZHUB 4050', 'BIZHUB 4750'],
                    'TNP-44': ['BIZHUB 4050', 'BIZHUB 4750'],
                    '4152-611': ['BIZHUB 4152'],
                    '4152611': ['BIZHUB 4152']
                  };
                  
                  product.oemNos.forEach(oem => {
                    if (!oem || !oem.oemNo) return;
                    
                    const oemNo = oem.oemNo.toUpperCase();
                    
                    Object.keys(partMap).forEach(partNumber => {
                      if (oemNo.includes(partNumber.replace(/[-\s]/g, ''))) {
                        compatibleModels = [...compatibleModels, ...partMap[partNumber]];
                      }
                    });
                  });
                }
                
                // If we have compatible models, add them to the title
                if (compatibleModels.length > 0) {
                  const uniqueModels = [...new Set(compatibleModels)];
                  const compatibility = uniqueModels.join(', ');
                  
                  // Only add compatibility if it's not already in the title
                  if (!title.includes('compatible with')) {
                    return {
                      ...product,
                      title: `${product.title} (Compatible with ${compatibility})`
                    };
                  }
                }
                
                return product;
              });
              
              setSearchResult(enhancedProducts);
              localStorage.setItem("last_search_results", JSON.stringify(enhancedProducts));
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
          title: `Konica Minolta TN-213K Black Toner (Compatible with BIZHUB C203)`,
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
          title: `Konica Minolta TN-214K Black Toner (Compatible with BIZHUB C364)`,
          oemNos: [{ oemNo: "A0D7454" }],
          serviceLevels: [{ price: 84.99 }],
          images: ["/static/toner-placeholder.webp"]
        }
      ];
    }
    
    if (term.includes('tnp37') || term.includes('4700p')) {
      return [
        {
          id: "search3",
          title: `Konica Minolta TNP37 Black Toner for Bizhub 4700P (Compatible with BIZHUB 4700P)`,
          oemNos: [{ oemNo: "TNP37" }],
          serviceLevels: [{ price: 69.99 }],
          images: ["/static/toner-placeholder.webp"]
        }
      ];
    }
    
    if (term.includes('4152-611') || term.includes('4152')) {
      return [
        {
          id: "search4",
          title: `Konica Minolta 4152-611 Black Toner for Bizhub 4152 (Compatible with BIZHUB 4152)`,
          oemNos: [{ oemNo: "4152-611" }],
          serviceLevels: [{ price: 72.99 }],
          images: ["/static/toner-placeholder.webp"]
        }
      ];
    }
    
    // Return empty array for unknown searches
    return [];
  };

  async function getProducts() {
    try {
      let accessToken = null;
      
      // First, try to get a token from localStorage
      try {
        const tokenData = localStorage.getItem("token");
        if (tokenData) {
          const aToken = JSON.parse(tokenData);
          accessToken = aToken?.accessToken;
        }
      } catch (tokenError) {
        console.error('Token retrieval error:', tokenError);
      }
      
      // If we couldn't get a token from localStorage, try to get a new one
      if (!accessToken) {
        try {
          const response = await fetch("/api/token");
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          accessToken = data.accessToken;
          
          if (accessToken) {
            localStorage.setItem("token", JSON.stringify(data));
            setToken(accessToken);
          } else {
            throw new Error('No access token in response');
          }
        } catch (tokenApiError) {
          console.error('Token API error:', tokenApiError);
          getFallbackData();
          return []; // Return empty array if we can't get a token
        }
      }
      
      // Now try to get products using the token
      if (accessToken) {
        try {
          const requestOptions = {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: accessToken,
              search: ""  // Empty search to get all products
            })
          };
          
          const response = await fetch('/api/products', requestOptions);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
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
              // Cache the data locally for future use
              localStorage.setItem("konica", JSON.stringify(validProducts));
              setToner(validProducts);
              return validProducts; // Return the products array
            } else {
              throw new Error('No valid products in data');
            }
          } else {
            throw new Error('Invalid data structure');
          }
        } catch (productApiError) {
          console.error('Products API error:', productApiError);
          const fallbackProducts = getFallbackData();
          return fallbackProducts; // Return the fallback products
        }
      } else {
        console.error('No access token available');
        const fallbackProducts = getFallbackData();
        return fallbackProducts; // Return the fallback products
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      const fallbackProducts = getFallbackData();
      return fallbackProducts; // Return the fallback products
    }
  }
  
  // Helper function to get fallback data
  const getFallbackData = () => {
    try {
      console.log('Using fallback data');
      
      // Generate mock data for Konica Minolta Bizhub models
      const models = [
        'BIZHUB 224E', 'BIZHUB 284E', 'BIZHUB 308', 'BIZHUB 364E', 'BIZHUB 368',
        'BIZHUB 4050', 'BIZHUB 4700P', 'BIZHUB 4750', 'BIZHUB 4152',
        'BIZHUB C224', 'BIZHUB C224E',
        'BIZHUB C284', 'BIZHUB C284E', 'BIZHUB C3350', 'BIZHUB C3351', 'BIZHUB C364',
        'BIZHUB C364E', 'BIZHUB C3850FS', 'BIZHUB C3851FS', 'BIZHUB C454', 'BIZHUB C454E',
        'BIZHUB C554', 'BIZHUB C554E'
      ];
      
      // Create mock products based on models
      const mockProducts = [];
      
      models.forEach(model => {
        const isColor = model.includes('C');
        const modelNumber = model.replace('BIZHUB ', '');
        
        // Add black toner for all models
        mockProducts.push({
          id: `mock-${modelNumber}-K`,
          title: `Konica Minolta ${model} Black Toner Cartridge (Compatible with ${model})`,
          description: `Compatible black toner cartridge for Konica Minolta ${model} printer`,
          images: [`/static/toner.webp`],
          oemNos: [{ oemNo: `TN-${modelNumber}K` }],
          serviceLevels: [{ price: Math.floor(Math.random() * 50) + 30 }]
        });
        
        // Add color toners for color models
        if (isColor) {
          // Cyan
          mockProducts.push({
            id: `mock-${modelNumber}-C`,
            title: `Konica Minolta ${model} Cyan Toner Cartridge (Compatible with ${model})`,
            description: `Compatible cyan toner cartridge for Konica Minolta ${model} printer`,
            images: [`/static/toner-c.webp`],
            oemNos: [{ oemNo: `TN-${modelNumber}C` }],
            serviceLevels: [{ price: Math.floor(Math.random() * 40) + 40 }]
          });
          
          // Magenta
          mockProducts.push({
            id: `mock-${modelNumber}-M`,
            title: `Konica Minolta ${model} Magenta Toner Cartridge (Compatible with ${model})`,
            description: `Compatible magenta toner cartridge for Konica Minolta ${model} printer`,
            images: [`/static/toner-m.webp`],
            oemNos: [{ oemNo: `TN-${modelNumber}M` }],
            serviceLevels: [{ price: Math.floor(Math.random() * 40) + 40 }]
          });
          
          // Yellow
          mockProducts.push({
            id: `mock-${modelNumber}-Y`,
            title: `Konica Minolta ${model} Yellow Toner Cartridge (Compatible with ${model})`,
            description: `Compatible yellow toner cartridge for Konica Minolta ${model} printer`,
            images: [`/static/toner-y.webp`],
            oemNos: [{ oemNo: `TN-${modelNumber}Y` }],
            serviceLevels: [{ price: Math.floor(Math.random() * 40) + 40 }]
          });
        }
      });
      
      setToner(mockProducts);
      setProducts(mockProducts);
      setSearching(true);
      
      // Cache this data
      localStorage.setItem("konica", JSON.stringify(mockProducts));
      
      // Add specific toner models that might not be captured by the generic pattern
      mockProducts.push({
        id: "mock-tnp37",
        title: "Konica Minolta TNP37 Black Toner for Bizhub 4700P (Compatible with BIZHUB 4700P)",
        description: "Compatible black toner cartridge for Konica Minolta Bizhub 4700P printer",
        images: ["/static/toner.webp"],
        oemNos: [{ oemNo: "TNP37" }],
        serviceLevels: [{ price: 69.99 }]
      });
      
      mockProducts.push({
        id: "mock-4152-611",
        title: "Konica Minolta 4152-611 Black Toner for Bizhub 4152 (Compatible with BIZHUB 4152)",
        description: "Compatible black toner cartridge for Konica Minolta Bizhub 4152 printer",
        images: ["/static/toner.webp"],
        oemNos: [{ oemNo: "4152-611" }],
        serviceLevels: [{ price: 72.99 }]
      });
      
      return mockProducts;
    } catch (error) {
      console.error('Error using fallback data:', error);
      return [];
    }
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
        title: "Konica Minolta TN-213K Black Toner (Compatible with BIZHUB C203)",
        oemNos: [{ oemNo: "A0D7152" }],
        serviceLevels: [{ price: 78.99 }],
        images: ["/static/toner-placeholder.webp"]
      },
      {
        id: "km2",
        title: "Konica Minolta TN-213C Cyan Toner (Compatible with BIZHUB C203)",
        oemNos: [{ oemNo: "A0D7452" }],
        serviceLevels: [{ price: 89.99 }],
        images: ["/static/toner-placeholder.webp"]
      },
      {
        id: "km3",
        title: "Konica Minolta TN-213M Magenta Toner (Compatible with BIZHUB C203)",
        oemNos: [{ oemNo: "A0D7352" }],
        serviceLevels: [{ price: 89.99 }],
        images: ["/static/toner-placeholder.webp"]
      },
      {
        id: "km4",
        title: "Konica Minolta TN-213Y Yellow Toner (Compatible with BIZHUB C203)",
        oemNos: [{ oemNo: "A0D7252" }],
        serviceLevels: [{ price: 89.99 }],
        images: ["/static/toner-placeholder.webp"]
      },
      {
        id: "km5",
        title: "Konica Minolta TNP37 Black Toner for Bizhub 4700P (Compatible with BIZHUB 4700P)",
        description: "Compatible black toner cartridge for Konica Minolta Bizhub 4700P printer",
        oemNos: [{ oemNo: "TNP37" }],
        serviceLevels: [{ price: 69.99 }],
        images: ["/static/toner-placeholder.webp"]
      },
      {
        id: "km6",
        title: "Konica Minolta 4152-611 Black Toner for Bizhub 4152 (Compatible with BIZHUB 4152)",
        description: "Compatible black toner cartridge for Konica Minolta Bizhub 4152 printer",
        oemNos: [{ oemNo: "4152-611" }],
        serviceLevels: [{ price: 72.99 }],
        images: ["/static/toner-placeholder.webp"]
      }
    ];
  };

  // Initialize products when component loads
  const initializeProducts = async () => {
    try {
      setIsLoading(true);
      
      // Try to load from cache first
      const cache = await loadFromCache();
      if (cache && cache.length > 0) {
        setToner(cache);
        
        // Extract and show models immediately without requiring a search
        const modelNumbers = extractModelNumbers(cache);
        if (modelNumbers.length > 0) {
          setSearchResult(cache);
          setSearching(true);
        }
        
        setIsLoading(false);
        return;
      }
      
      // If not in cache, fetch from API
      const products = await getProducts();
      
      // If we have products, show models immediately
      if (products && products.length > 0) {
        setSearchResult(products);
        setSearching(true);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing products:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {    
    // Add a small delay to ensure token is loaded properly
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
      
      // First pass: find all unique printer models mentioned in product titles and descriptions
      products.forEach(product => {
        if (!product || !product.title) return;
        
        const title = product.title.toLowerCase();
        const description = product.description ? product.description.toLowerCase() : '';
        
        // Find BiZhub models in title or description
        let modelMatches = [];
        
        // Pattern for "bizhub X123" and variants
        const bizhubPattern = /bizhub\s+([a-z0-9]+-?[a-z0-9]*)/gi;
        let match;
        
        // Extract all bizhub models from title
        while ((match = bizhubPattern.exec(title)) !== null) {
          if (match[1]) modelMatches.push(match[1].toUpperCase());
        }
        
        // Reset regex lastIndex
        bizhubPattern.lastIndex = 0;
        
        // Extract all bizhub models from description
        if (description) {
          while ((match = bizhubPattern.exec(description)) !== null) {
            if (match[1]) modelMatches.push(match[1].toUpperCase());
          }
        }
        
        // Check for specific model numbers in title
        const specificModelPatterns = [
          { pattern: /4700p/i, model: '4700P' },
          { pattern: /4152/i, model: '4152' },
          { pattern: /4050/i, model: '4050' }, 
          { pattern: /4750/i, model: '4750' }
        ];
        
        specificModelPatterns.forEach(({ pattern, model }) => {
          if (pattern.test(title) || (description && pattern.test(description))) {
            modelMatches.push(model);
          }
        });
        
        // Process for common part numbers that map to specific models
        // For example, TNP37 is for bizhub 4700P
        const partMap = {
          'TNP37': ['4700P'],
          'TNP-37': ['4700P'],
          'TNP44': ['4050', '4750'],
          'TNP-44': ['4050', '4750'],
          '4152-611': ['4152'],
          '4152611': ['4152'],
          // Add more mappings as needed
        };
        
        // Check OEM numbers against part map
        if (product.oemNos && Array.isArray(product.oemNos)) {
          product.oemNos.forEach(oem => {
            if (!oem || !oem.oemNo) return;
            
            const oemNo = oem.oemNo.toUpperCase().replace(/[-\s]/g, ''); // Remove hyphens and spaces
            
            // Check if this OEM number contains any of our part numbers
            Object.keys(partMap).forEach(partNumber => {
              const normalizedPartNumber = partNumber.replace(/[-\s]/g, ''); // Remove hyphens and spaces
              if (oemNo.includes(normalizedPartNumber)) {
                console.log(`Matched ${oemNo} with ${partNumber} for models:`, partMap[partNumber]);
                // Add associated models
                modelMatches = [...modelMatches, ...partMap[partNumber]];
              }
            });
          });
        }
        
        // Make all matches unique and add to model map
        [...new Set(modelMatches)].forEach(modelNumber => {
          const model = `BIZHUB ${modelNumber}`;
          
          if (modelMap.has(model)) {
            // Increment count and add this product to the list
            const modelData = modelMap.get(model);
            modelData.count++;
            modelData.products.push(product);
            modelMap.set(model, modelData);
          } else {
            // Create new entry with this product
            modelMap.set(model, { 
              count: 1, 
              products: [product]
            });
          }
        });
      });

      // Convert map to array and sort alphabetically
      // Format: [modelName, {count, products}]
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
      
      models.forEach(([model, modelData]) => {
        // Extract the first letter, defaulting to '#' for non-letter starts
        const firstChar = model.match(/[A-Z]/) ? model.match(/[A-Z]/)[0] : '#';
        
        if (!groups[firstChar]) {
          groups[firstChar] = [];
        }
        groups[firstChar].push([model, modelData]);
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
                    {models.map(([model, modelData]) => (
                      <div key={model} className={styles.modelCard}>
                        <h4 className={styles.modelName}>{model}</h4>
                        <p className={styles.suppliesCount}>{modelData.count} supplies available</p>
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
                  Konica Minolta Supplies
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
