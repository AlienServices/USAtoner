"use client"
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import styles from '../../../page.module.css';
import { CartContext } from '../../../providers/cart';
import { removeCloverImaging } from '../../../../lib/utility';
import { Audio } from 'react-loader-spinner';
import OriginFilter from '../../../components/OriginFilter';

export default function ModelProducts() {
  const params = useParams();
  const modelName = decodeURIComponent(params.model);
  const { cart, setCart, tonerOem } = useContext(CartContext);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [originFilters, setOriginFilters] = useState({
    usaMade: false,
    americasMade: false,
    worldWideMade: false,
    chineseMade: false
  });
  const initialLoadRef = useRef(true);

  useEffect(() => {
    const fetchModelProducts = async () => {
      setLoading(true);
      try {
        // Check if localStorage is available (for SSR)
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }
        
        let aToken;
        try {
          aToken = JSON.parse(localStorage.getItem("token"));
        } catch (error) {
          console.error("Error parsing token:", error);
          setLoading(false);
          return;
        }
        
        if (!aToken || !aToken.accessToken) {
          console.error("No valid token found");
          setLoading(false);
          return;
        }

        const requestOptions = {
          method: "POST",
          body: JSON.stringify({
            token: aToken.accessToken,
            search: `Brother ${modelName}`
          })
        };

        const response = await fetch('/api/products', requestOptions);
        const data = await response.json();
        
        if (data && data.cancel && data.cancel.products) {
          const productsData = data.cancel.products;
          setProducts(productsData);
          // Initial load - just set the filtered products without additional filtering
          if (initialLoadRef.current) {
            setFilteredProducts(productsData);
            initialLoadRef.current = false;
          } else {
            // Not initial load - apply filters
            applyFilters(activeFilter, originFilters, productsData);
          }
        }
      } catch (error) {
        console.error("Error fetching model products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModelProducts();
  }, [modelName]);

  // Apply filters when activeFilter or originFilters change, but only after initial load
  useEffect(() => {
    if (!initialLoadRef.current && products.length > 0) {
      applyFilters(activeFilter, originFilters, products);
    }
  }, [activeFilter, originFilters]);

  // Handle origin filter changes
  const handleOriginFilterChange = (filters) => {
    setOriginFilters(filters);
  };

  // Filter products by type (toner, drum, etc.)
  const filterByType = (type) => {
    setActiveFilter(type);
  };

  // Filter products by origin
  const filterProductsByOrigin = (products, filters) => {
    // Safety check for null/undefined products
    if (!products || !Array.isArray(products)) {
      console.error("Brother - Products is not an array:", products);
      return [];
    }
    
    // If no filters are active, return all products
    if (!filters.usaMade && !filters.americasMade && !filters.worldWideMade) {
      return products;
    }

    return products.filter(product => {
      // Check if product has origin information
      const origin = (product.origin || 'unknown').toLowerCase();
      
      // Apply filters
      if (filters.usaMade && origin.includes('usa')) {
        return true;
      }
      
      if (filters.americasMade && 
          (origin.includes('usa') || 
           origin.includes('canada') || 
           origin.includes('mexico') ||
           origin.includes('americas'))) {
        return true;
      }
      
      if (filters.worldWideMade) {
        // If the product is from China, only show if Chinese products are allowed
        if (origin.includes('china')) {
          return filters.chineseMade;
        }
        // For all other worldwide products (not Chinese), show them if worldwide is selected
        return true;
      }
      
      return false;
    });
  };

  // Apply both type and origin filters
  const applyFilters = (type, origins, productsToFilter = products) => {
    let typeFiltered = productsToFilter;
    
    if (type !== 'all') {
      typeFiltered = productsToFilter.filter(product => {
        const title = removeCloverImaging(product.title || '').toLowerCase();
        
        switch(type) {
          case 'toner':
            return title.includes('toner') || title.includes('cartridge');
          case 'drum':
            return title.includes('drum') || title.includes('imaging');
          case 'maintenance':
            return title.includes('maintenance') || title.includes('kit') || title.includes('fuser');
          default:
            return true;
        }
      });
    }
    
    // Apply origin filters on top of type filtering
    const finalFiltered = filterProductsByOrigin(typeFiltered, origins);
    setFilteredProducts(finalFiltered);
  };

  // Group products by color
  const colorGroups = ['black', 'cyan', 'magenta', 'yellow'];
  const groupedByColor = {};
  
  colorGroups.forEach(color => {
    groupedByColor[color] = filteredProducts.filter(product => {
      const title = removeCloverImaging(product.title || '').toLowerCase();
      return title.includes(color);
    });
  });
  
  // Get products not in a color group
  const otherProducts = filteredProducts.filter(product => {
    const title = removeCloverImaging(product.title || '').toLowerCase();
    return !colorGroups.some(color => title.includes(color));
  });

  return (
    <div className={styles.main}>
      <Header />
      <div className={styles.secondSection}>
        <div className={styles.modelProductsHeader}>
          <h1 className={styles.modelProductsTitle}>
            Supplies for Brother {modelName}
          </h1>
          <Link href="/brother" className={styles.backLink}>
            &larr; Back to Brother Models
          </Link>
        </div>
        
        {/* Type filters */}
        <div className={styles.productTypeFilters}>
          <button 
            className={`${styles.typeFilterButton} ${activeFilter === 'all' ? styles.activeFilterButton : ''}`}
            onClick={() => filterByType('all')}
          >
            All Supplies
          </button>
          <button 
            className={`${styles.typeFilterButton} ${activeFilter === 'toner' ? styles.activeFilterButton : ''}`}
            onClick={() => filterByType('toner')}
          >
            Toner Cartridges
          </button>
          <button 
            className={`${styles.typeFilterButton} ${activeFilter === 'drum' ? styles.activeFilterButton : ''}`}
            onClick={() => filterByType('drum')}
          >
            Drums & Imaging
          </button>
          <button 
            className={`${styles.typeFilterButton} ${activeFilter === 'maintenance' ? styles.activeFilterButton : ''}`}
            onClick={() => filterByType('maintenance')}
          >
            Maintenance Kits
          </button>
        </div>
        
        {/* Origin Filter */}
        <div className={styles.originFilterContainer} style={{padding: '20px'}}>
          <OriginFilter onFilterChange={handleOriginFilterChange} />
        </div>
        
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
        ) : (
          <>
            {filteredProducts.length > 0 ? (
              <div className={styles.modelProductsContent}>
                {/* Color sets section */}
                {Object.values(groupedByColor).some(group => group.length > 0) && (
                  <div className={styles.colorSetsSection}>
                    <h2 className={styles.sectionTitle}>Toner Sets</h2>
                    <div className={styles.colorSetsContainer}>
                      <div className={styles.boxContainer}>
                        {colorGroups.map(color => 
                          groupedByColor[color].map((product, index) => 
                            index === 0 && ( // Only show the first product of each color
                              <div key={product.oemNos[0]?.oemNo || product.id} className={styles.box}>
                                <Image
                                  alt={`${color} toner for Brother ${modelName}`}
                                  style={{ borderRadius: "5px" }}
                                  src={product.images[0]}
                                  width={180}
                                  height={180}
                                />
                                <div className={styles.titleSmallBlack}>{removeCloverImaging(product.title)}</div>
                                <div className={styles.colorBadge} style={{ backgroundColor: color }}>
                                  {color.charAt(0).toUpperCase() + color.slice(1)}
                                </div>
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
                                          {product.serviceLevels[0].price}
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
                                      <div className={styles.modelSmall}>{product.oemNos[0]?.oemNo}</div>
                                    </div>
                                  </div>
                                </div>
                                <div style={{ width: "85%" }} className={styles.row}>
                                  <Link href={`/tonerChoice?oem=${product.oemNos[0]?.oemNo}`}>
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
                                            name: removeCloverImaging(product.title),
                                            oem: product.oemNos[0]?.oemNo,
                                            price: product.serviceLevels[0].price,
                                            quantity: 1,
                                            image: product.images[0],
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
                            )
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Other products section */}
                {otherProducts.length > 0 && (
                  <div className={styles.otherProductsSection}>
                    <h2 className={styles.sectionTitle}>Other Supplies</h2>
                    <div className={styles.boxContainer}>
                      {otherProducts.map(product => (
                        <div key={product.oemNos[0]?.oemNo || product.id} className={styles.box}>
                          <Image
                            alt={`Supply for Brother ${modelName}`}
                            style={{ borderRadius: "5px" }}
                            src={product.images[0]}
                            width={180}
                            height={180}
                          />
                          <div className={styles.titleSmallBlack}>{removeCloverImaging(product.title)}</div>
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
                                    {product.serviceLevels[0].price}
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
                                <div className={styles.modelSmall}>{product.oemNos[0]?.oemNo}</div>
                              </div>
                            </div>
                          </div>
                          <div style={{ width: "85%" }} className={styles.row}>
                            <Link href={`/tonerChoice?oem=${product.oemNos[0]?.oemNo}`}>
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
                                      name: removeCloverImaging(product.title),
                                      oem: product.oemNos[0]?.oemNo,
                                      price: product.serviceLevels[0].price,
                                      quantity: 1,
                                      image: product.images[0],
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
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.emptyProductsContainer}>
                <div className={styles.nothing}>No supplies found for Brother {modelName}</div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
} 