"use client"
import React, { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { Audio } from 'react-loader-spinner';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function CloverCount() {
  const [countData, setCountData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCloverCount() {
      try {
        setLoading(true);
        const response = await fetch('/api/clover-count');
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        setCountData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching Clover count:', err);
        setError(err.message || 'Failed to fetch Clover product count');
      } finally {
        setLoading(false);
      }
    }

    fetchCloverCount();
  }, []);

  return (
    <main className={styles.main}>
      <Header />
      
      <div className={styles.center} style={{ padding: '2rem' }}>
        <h1 className={styles.title}>Clover Imaging API Inventory Count</h1>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
            <Audio
              height="80"
              width="80"
              radius="9"
              color="green"
              ariaLabel="loading"
            />
          </div>
        ) : error ? (
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem',
            backgroundColor: '#ffdddd',
            borderRadius: '0.5rem',
            color: '#d32f2f',
            maxWidth: '800px',
            margin: '2rem auto'
          }}>
            <h3>Error Loading Data</h3>
            <p>{error}</p>
          </div>
        ) : (
          <div style={{ 
            marginTop: '2rem',
            backgroundColor: '#f5f5f5',
            padding: '2rem',
            borderRadius: '0.5rem',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ marginBottom: '0.5rem' }}>Inventory Summary</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <h3>Current Page Items</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2e7d32' }}>
                    {countData?.count?.items || 0}
                  </p>
                </div>
                <div>
                  <h3>Estimated Total Items</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2e7d32' }}>
                    {countData?.count?.estimatedTotalItems || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h3>Pagination Info</h3>
              <p>Current Page: <strong>{countData?.count?.currentPage || 1}</strong></p>
              <p>Total Pages: <strong>{countData?.count?.totalPages || 1}</strong></p>
            </div>
            
            <div>
              <h3>API Details</h3>
              <p>Provider: <strong>{countData?.apiDetails?.provider || 'Clover Imaging API'}</strong></p>
              <p>Timestamp: <strong>{countData?.apiDetails?.timestamp ? new Date(countData.apiDetails.timestamp).toLocaleString() : 'N/A'}</strong></p>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </main>
  );
} 