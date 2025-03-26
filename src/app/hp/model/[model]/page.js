"use client"
import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import styles from '../../../page.module.css';
import { CartContext } from '../../../providers/cart';
import { removeCloverImaging } from '../../../../lib/utility';
import { Audio } from 'react-loader-spinner';

export default function ModelProducts() {
  const params = useParams();
  const modelName = decodeURIComponent(params.model);
  const { cart, setCart, tonerOem } = useContext(CartContext);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const fetchModelProducts = async () => {
      setLoading(true);
      try {
        const aToken = JSON.parse(localStorage.getItem("token"));
        if (!aToken) {
          console.error("No token found");
          setLoading(false);
          return;
        }

        const requestOptions = {
          method: "POST",
          body: JSON.stringify({
            token: aToken.accessToken,
            search: `HP ${modelName}`
          })
        };

        const response = await fetch('/api/products', requestOptions);
        const data = await response.json();
        
        if (data && data.cancel && data.cancel.products) {
          setProducts(data.cancel.products);
          setFilteredProducts(data.cancel.products);
        }
      } catch (error) {
        console.error("Error fetching model products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModelProducts();
  }, [modelName]);

  // Filter products by type (toner, drum, etc.)
  const filterByType = (type) => {
    setActiveFilter(type);
    
    if (type === 'all') {
      setFilteredProducts(products);
      return;
    }
    
    const filtered = products.filter(product => {
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
    
    setFilteredProducts(filtered);
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
            Supplies for HP {modelName}
          </h1>
          <Link href="/hp" className={styles.backLink}>
            &larr; Back to HP Models
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
                                  alt={`${color} toner for HP ${modelName}`}
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
                            alt={`Supply for HP ${modelName}`}
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
                <div className={styles.nothing}>No supplies found for HP {modelName}</div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
} 