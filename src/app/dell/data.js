"use client"
import React, { useState, useRef, useContext, useEffect } from "react";
import Image from "next/image";
import { Audio } from 'react-loader-spinner'
import Header from "../components/Header";
import Link from "next/link";
import styles from "../page.module.css";
import { CartContext } from "../providers/cart/index";
import Footer from "../components/Footer";
import { mergeInventory } from "@/utils/dataTransformers";

export default function Data() {
  const [inputData, setInputData] = useState("");
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllData() {
      try {
        // Fetch FTP data with debugging
        console.log('Fetching FTP data...');
        const ftpResponse = await fetch('/data/dell-catalog.json')
        if (!ftpResponse.ok) {
          console.error('FTP fetch failed:', ftpResponse.status, ftpResponse.statusText);
        }
        const ftpData = ftpResponse.ok ? await ftpResponse.json() : []
        console.log('FTP data:', ftpData);

        // Fetch Clover data with debugging
        console.log('Fetching Clover data...');
        const aToken = JSON.parse(localStorage.getItem("token"))
        const cloverResponse = await fetch('/api/products', {
          method: "POST",
          body: JSON.stringify({ token: aToken.accessToken, search: "dell" })
        })
        const cloverData = cloverResponse.ok ? 
          (await cloverResponse.json())?.cancel?.products || [] : []
        console.log('Clover data:', cloverData);

        // Debug merged data
        const mergedData = mergeInventory(cloverData, ftpData)
        console.log('Merged data:', mergedData);
        
        setProducts(mergedData)
        setSearching(true)
        setLoading(false)
        
        localStorage.setItem("dell", JSON.stringify(mergedData))
      } catch (err) {
        console.error('Error fetching products:', err)
        setLoading(false)
      }
    }

    fetchAllData()
  }, [])

  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase()
    setInputData(searchTerm)

    if (searchTerm === "") {
      setSearchResult(null)
      return
    }

    const filtered = products.filter((item) =>
      item.oem?.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm)
    )
    setSearchResult(filtered)
  }

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
                  Dell Cartridges
                </div>
              </h1>
              <input 
                onChange={handleSearch} 
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearching(!searching)
                    window.location.replace('#toner')
                  }
                }} 
                className={styles.search} 
                placeholder="Shop by OEM, Brand, or Model"
              />
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
        <div className={styles.center}>
          {loading ? (
            <Audio
              height="80"
              width="80"
              radius="9"
              color="black"
              ariaLabel="loading"
              wrapperStyle
              wrapperClass
            />
          ) : (
            <>
              {(searchResult || products)?.map((item, index) => (
                <div
                  key={`${item.oem}-${item.source}-${index}`}
                  className={styles.box}
                >
                  <div className={styles.imageContainer}>
                    <Image
                      alt={'image of toner'}
                      style={{ borderRadius: "5px" }}
                      src={item.images?.[0] || '/placeholder-toner.jpg'}
                      width={180}
                      height={180}
                      priority={index < 4}
                    />
                  </div>
                  <div className={styles.something}>
                    <div style={{ fontSize: "18px", textAlign: "center" }}>
                      {item.oem}
                    </div>
                    <div style={{ fontSize: "13px", textAlign: "center" }}>
                      {item.description}
                    </div>
                    <div style={{ fontSize: "18px", textAlign: "center" }}>
                      ${item.price}
                    </div>
                    <div style={{ fontSize: "14px", textAlign: "center", color: item.stock > 0 ? 'green' : 'red' }}>
                      {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </div>
                    <div style={{ fontSize: "12px", textAlign: "center", color: 'gray' }}>
                      Source: {item.source === 'clover' ? 'Clover' : 'International'}
                    </div>
                    <div style={{ width: "85%" }} className={styles.row}>
                      <Link 
                        href={`/tonerChoice?oem=${item.oemNos?.[0]?.oemNo || item.oem}`}
                      >
                        <button 
                          className={styles.buttonBlue}
                          onClick={() => {}}
                        >
                          See Details
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
