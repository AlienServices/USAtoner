"use client"
import React, { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { Audio } from 'react-loader-spinner'
import Header from "../components/Header";
import Link from "next/link";
import styles from "../page.module.css";
import { CartContext } from "../providers/cart";
import Footer from "../components/Footer";

export default function AllProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { cart, setCart } = useContext(CartContext);

  useEffect(() => {
    // Load full inventory from localStorage
    const fullInventory = localStorage.getItem("fullInventory");
    if (fullInventory) {
      setProducts(JSON.parse(fullInventory));
      setLoading(false);
    } else {
      // If no cached inventory, fetch it
      fetch('/api/inventory')
        .then(res => res.json())
        .then(data => {
          const transformedProducts = data.data.map(item => ({
            id: item.sku || item.id || Math.random().toString(36).substr(2, 9),
            title: item.description || 'ITC Product',
            price: Number(item.price).toFixed(2),
            images: ['/static/placeholder.svg'],
            description: item.description || '',
            category: 'ITC',
            quantity: item.quantity || 0,
            itcProduct: true,
            oemNos: [{
              oemNo: item.mfgPartNumber || item.sku
            }],
            serviceLevels: [{
              price: Number(item.price).toFixed(2)
            }],
            manufacturerName: item.manufacturerName || getBrandFromSKU(item.sku)
          }));
          setProducts(transformedProducts);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching products:", err);
          setLoading(false);
        });
    }
  }, []);

  // Helper function to detect brand from SKU
  function getBrandFromSKU(sku) {
    const skuLower = sku.toLowerCase();
    if (skuLower.includes('br')) return 'Brother';
    if (skuLower.includes('hp')) return 'HP';
    if (skuLower.includes('lex')) return 'Lexmark';
    if (skuLower.includes('xer')) return 'Xerox';
    if (skuLower.includes('dell')) return 'Dell';
    if (skuLower.includes('kon')) return 'Konica';
    return 'Other';
  }

  return (
    <div className={styles.main}>
      <Header />
      <div className={styles.secondSection}>
        <div className={styles.center}>
          {loading ? (
            <div className={''}>
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
            <div className={styles.boxContainer}>
              {products.map((toner) => (
                <div
                  key={toner.id || toner.sku || Math.random().toString(36).substr(2, 9)}
                  className={styles.box}
                >
                  <Image
                    alt={'image of toner'}
                    style={{ borderRadius: "5px" }}
                    src={toner.images?.[0] || '/static/placeholder.svg'}
                    width={180}
                    height={180}
                  />
                  <div className={styles.titleSmallBlack}>{toner.title}</div>
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
                            {toner.serviceLevels?.[0]?.price || toner.price}
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
                        <div className={styles.modelSmall}>
                          {toner.oemNos?.[0]?.oemNo || toner.mfgPartNumber || toner.sku}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ width: "85%" }} className={styles.row}>
                    <Link href={`/tonerChoice?oem=${toner.oemNos?.[0]?.oemNo || toner.mfgPartNumber || toner.sku}`}>
                      <button className={styles.buttonBlue}>See Details</button>
                    </Link>
                    <Link href={'/carts'}>
                      <button style={{ backgroundColor: "rgb(131,208,130)" }} className={styles.buttonBlue} onClick={() => {
                        const updatedCart = [
                          ...cart,
                          {
                            name: toner.title,
                            oem: toner.oemNos?.[0]?.oemNo || toner.mfgPartNumber || toner.sku,
                            price: toner.serviceLevels?.[0]?.price || toner.price,
                            quantity: 1,
                            image: toner.images?.[0] || '/static/placeholder.svg',
                          },
                        ];
                        setCart(updatedCart)
                      }}>Add to cart</button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
} 