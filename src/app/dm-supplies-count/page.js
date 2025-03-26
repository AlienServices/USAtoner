"use client"
import React, { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { Audio } from 'react-loader-spinner';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function DMSuppliesCount() {
  const [countData, setCountData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Define a self-executing async function to avoid Promise handling issues
    (async () => {
      try {
        setLoading(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        // Using a timeout and signal to prevent hanging requests
        const response = await fetch('/api/dm-supplies-count', {
          method: 'GET',
          cache: 'no-cache',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response || !response.ok) {
          throw new Error(`API responded with status: ${response?.status || 'unknown'}`);
        }
        
        const data = await response.json();
        
        if (!data) {
          throw new Error('No data received from API');
        }
        
        setCountData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching DM Supplies count:', err);
        // Handle abort errors differently
        if (err.name === 'AbortError') {
          setError('Request timed out. The server took too long to respond.');
        } else {
          setError(err.message || 'Failed to fetch DM Supplies product count');
        }
        setCountData(null);
      } finally {
        setLoading(false);
      }
    })().catch(err => {
      // This will catch any errors that might occur in the async IIFE itself
      console.error('Unexpected error in effect:', err);
      setError('An unexpected error occurred. Please try again later.');
      setLoading(false);
    });
    
    // Cleanup function for the effect
    return () => {
      // Any cleanup needed (like aborting pending requests)
    };
  }, []);

  return (
    <main className={styles.main}>
      <Header />
      
      <div className={styles.center} style={{ padding: '2rem' }}>
        <h1 className={styles.title}>DM Supplies API Inventory Count</h1>
        
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
            <p style={{ marginTop: '1rem' }}>
              <strong>Note:</strong> For the DM Supplies API to work correctly, you need to update the ContactID and APIKey in 
              <code style={{ backgroundColor: '#f5f5f5', padding: '0.25rem', margin: '0 0.25rem' }}>src/app/api/dm-supplies-count/route.js</code>
            </p>
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
              <div>
                <h3>Total Items in Inventory</h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2e7d32' }}>
                  {countData?.count?.totalItems ? countData.count.totalItems.toLocaleString() : '0'}
                </p>
              </div>
              
              {/* Display note if using mock data */}
              {countData?.apiDetails?.note && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  backgroundColor: '#fff3e0', 
                  borderRadius: '0.25rem',
                  border: '1px solid #ffe0b2'
                }}>
                  <p><strong>Note:</strong> {countData.apiDetails.note}</p>
                  {countData.apiDetails.error && (
                    <p style={{ marginTop: '0.5rem' }}><strong>Error:</strong> {countData.apiDetails.error}</p>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <h3>API Details</h3>
              <p>Provider: <strong>{countData?.apiDetails?.provider || 'DM Supplies API'}</strong></p>
              <p>Agreement Schedule ID: <strong>{countData?.apiDetails?.agreementScheduleID || 'N/A'}</strong></p>
              <p>Timestamp: <strong>{countData?.apiDetails?.timestamp ? new Date(countData.apiDetails.timestamp).toLocaleString() : 'N/A'}</strong></p>
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              <h3>Setup Instructions</h3>
              <ol style={{ paddingLeft: '1.5rem' }}>
                <li>
                  Open <code style={{ backgroundColor: '#e0e0e0', padding: '0.25rem' }}>src/app/api/dm-supplies-count/route.js</code>
                </li>
                <li>
                  Replace <code style={{ backgroundColor: '#e0e0e0', padding: '0.25rem' }}>your-contact-id</code> with your actual DM Supplies Contact ID
                </li>
                <li>
                  Replace <code style={{ backgroundColor: '#e0e0e0', padding: '0.25rem' }}>your-api-key</code> with your actual DM Supplies API Key
                </li>
                <li>
                  The Agreement Schedule ID is already set to: <code style={{ backgroundColor: '#e0e0e0', padding: '0.25rem' }}>QT23-090684</code>
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </main>
  );
} 