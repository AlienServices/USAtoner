"use client"
import React, { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { Audio } from 'react-loader-spinner';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function InventoryCounts() {
  // Clover state
  const [cloverData, setCloverData] = useState(null);
  const [cloverLoading, setCloverLoading] = useState(true);
  const [cloverError, setCloverError] = useState(null);
  
  // DM Supplies state
  const [dmSuppliesData, setDmSuppliesData] = useState(null);
  const [dmSuppliesLoading, setDmSuppliesLoading] = useState(true);
  const [dmSuppliesError, setDmSuppliesError] = useState(null);

  useEffect(() => {
    // Fetch Clover data
    async function fetchCloverCount() {
      try {
        setCloverLoading(true);
        const response = await fetch('/api/clover-count');
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        setCloverData(data);
        setCloverError(null);
      } catch (err) {
        console.error('Error fetching Clover count:', err);
        setCloverError(err.message || 'Failed to fetch Clover product count');
      } finally {
        setCloverLoading(false);
      }
    }

    // Fetch DM Supplies data
    async function fetchDMSuppliesCount() {
      try {
        setDmSuppliesLoading(true);
        const response = await fetch('/api/dm-supplies-count');
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        setDmSuppliesData(data);
        setDmSuppliesError(null);
      } catch (err) {
        console.error('Error fetching DM Supplies count:', err);
        setDmSuppliesError(err.message || 'Failed to fetch DM Supplies product count');
      } finally {
        setDmSuppliesLoading(false);
      }
    }

    // Call both fetch functions
    fetchCloverCount();
    fetchDMSuppliesCount();
  }, []);

  // Helper function to render loading state
  const renderLoading = () => (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
      <Audio
        height="60"
        width="60"
        radius="9"
        color="green"
        ariaLabel="loading"
      />
    </div>
  );

  // Helper function to render error state
  const renderError = (error, apiType) => (
    <div style={{ 
      padding: '1rem',
      backgroundColor: '#ffdddd',
      borderRadius: '0.5rem',
      color: '#d32f2f',
      margin: '1rem 0'
    }}>
      <h4>Error Loading {apiType} Data</h4>
      <p>{error}</p>
    </div>
  );

  // Helper function to calculate total inventory
  const calculateTotalInventory = () => {
    let total = 0;
    
    // Add Clover inventory if available
    if (cloverData?.count?.estimatedTotalItems) {
      total += cloverData.count.estimatedTotalItems;
    }
    
    // Add DM Supplies inventory if available
    if (dmSuppliesData?.count?.totalItems) {
      total += dmSuppliesData.count.totalItems;
    }
    
    return total;
  };

  // Check if either API is using mock data
  const isUsingMockData = () => {
    return (
      cloverData?.apiDetails?.note?.includes('mock') || 
      dmSuppliesData?.apiDetails?.note?.includes('mock') ||
      cloverData?.apiDetails?.note?.includes('fallback') ||
      dmSuppliesData?.apiDetails?.note?.includes('fallback')
    );
  };

  return (
    <main className={styles.main}>
      <Header />
      
      <div className={styles.center} style={{ padding: '2rem' }}>
        <h1 className={styles.title}>Inventory Management Dashboard</h1>
        
        {/* Mock data warning if applicable */}
        {!cloverLoading && !dmSuppliesLoading && isUsingMockData() && (
          <div style={{ 
            backgroundColor: '#fff3e0', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            border: '1px solid #ffe0b2',
            maxWidth: '800px',
            margin: '1rem auto'
          }}>
            <h3 style={{ color: '#e65100' }}>⚠️ Using Demonstration Data</h3>
            <p>
              Some inventory data shown is mock/demonstration data. To see actual inventory counts, 
              you need to configure your API credentials.
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              See the setup instructions at the bottom of this page.
            </p>
          </div>
        )}
        
        {/* Total Combined Inventory */}
        <div style={{ 
          marginTop: '2rem',
          backgroundColor: '#e8f5e9',
          padding: '2rem',
          borderRadius: '0.5rem',
          maxWidth: '800px',
          margin: '0 auto 2rem'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Total Combined Inventory</h2>
          <p style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: '#2e7d32', 
            textAlign: 'center'
          }}>
            {calculateTotalInventory().toLocaleString()}
          </p>
        </div>
        
        {/* Two-column layout for inventory sources */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Clover Imaging */}
          <div style={{ 
            backgroundColor: '#f5f5f5',
            padding: '1.5rem',
            borderRadius: '0.5rem'
          }}>
            <h2 style={{ marginBottom: '1rem' }}>Clover Imaging</h2>
            
            {cloverLoading ? renderLoading() : 
              cloverError ? renderError(cloverError, 'Clover') : (
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <h3>Current Page Items</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2e7d32' }}>
                      {cloverData?.count?.items?.toLocaleString() || 0}
                    </p>
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <h3>Estimated Total Items</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2e7d32' }}>
                      {cloverData?.count?.estimatedTotalItems?.toLocaleString() || 0}
                    </p>
                  </div>
                  
                  <div>
                    <h4>Pagination</h4>
                    <p>Page {cloverData?.count?.currentPage || 1} of {cloverData?.count?.totalPages || 1}</p>
                  </div>
                  
                  {cloverData?.apiDetails?.note && (
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '0.5rem', 
                      backgroundColor: '#fff3e0', 
                      borderRadius: '0.25rem',
                      fontSize: '0.9rem'
                    }}>
                      <p><strong>Note:</strong> {cloverData.apiDetails.note}</p>
                    </div>
                  )}
                </div>
              )
            }
          </div>
          
          {/* DM Supplies */}
          <div style={{ 
            backgroundColor: '#f5f5f5',
            padding: '1.5rem',
            borderRadius: '0.5rem'
          }}>
            <h2 style={{ marginBottom: '1rem' }}>DM Supplies</h2>
            
            {dmSuppliesLoading ? renderLoading() : 
              dmSuppliesError ? renderError(dmSuppliesError, 'DM Supplies') : (
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <h3>Total Items in Inventory</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2e7d32' }}>
                      {dmSuppliesData?.count?.totalItems?.toLocaleString() || 0}
                    </p>
                  </div>
                  
                  <div>
                    <h4>Agreement Details</h4>
                    <p>Schedule ID: {dmSuppliesData?.apiDetails?.agreementScheduleID || 'N/A'}</p>
                  </div>
                  
                  {dmSuppliesData?.apiDetails?.note && (
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '0.5rem', 
                      backgroundColor: '#fff3e0', 
                      borderRadius: '0.25rem',
                      fontSize: '0.9rem'
                    }}>
                      <p><strong>Note:</strong> {dmSuppliesData.apiDetails.note}</p>
                    </div>
                  )}
                </div>
              )
            }
          </div>
        </div>
        
        {/* Setup Instructions */}
        <div style={{ 
          marginTop: '2rem',
          backgroundColor: '#f5f5f5',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          maxWidth: '800px',
          margin: '2rem auto'
        }}>
          <h3>Setup Instructions</h3>
          
          <h4 style={{ marginTop: '1rem' }}>DM Supplies API</h4>
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
          </ol>
          
          <h4 style={{ marginTop: '1rem' }}>API Information</h4>
          <p>Clover timestamp: {cloverData?.apiDetails?.timestamp ? new Date(cloverData.apiDetails.timestamp).toLocaleString() : 'N/A'}</p>
          <p>DM Supplies timestamp: {dmSuppliesData?.apiDetails?.timestamp ? new Date(dmSuppliesData.apiDetails.timestamp).toLocaleString() : 'N/A'}</p>
        </div>
      </div>
      
      <Footer />
    </main>
  );
} 