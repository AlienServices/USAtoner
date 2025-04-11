"use client"
import React, { useState, useEffect } from 'react';
import styles from '../page.module.css';

const OriginFilter = ({ onFilterChange }) => {
  const [usaMade, setUsaMade] = useState(false);
  const [americasMade, setAmericasMade] = useState(false);
  const [worldWideMade, setWorldWideMade] = useState(true); // Default to worldwide
  const [chineseMade, setChineseMade] = useState(false); // Default to NOT showing Chinese products

  // Initial setup - apply default filters on mount
  useEffect(() => {
    // Apply default filters - show worldwide but not Chinese
    const defaultFilters = {
      usaMade: false,
      americasMade: false,
      worldWideMade: true,
      chineseMade: false
    };
    
    console.log('OriginFilter: Setting default filters:', defaultFilters);
    onFilterChange(defaultFilters);
  }, []);

  const handleFilterChange = (filterType, value) => {
    let updatedFilters = {};
    
    switch (filterType) {
      case 'usa':
        setUsaMade(value);
        updatedFilters = {
          usaMade: value,
          americasMade: americasMade,
          worldWideMade: worldWideMade,
          chineseMade: chineseMade
        };
        break;
      case 'americas':
        setAmericasMade(value);
        updatedFilters = {
          usaMade: usaMade,
          americasMade: value,
          worldWideMade: worldWideMade,
          chineseMade: chineseMade
        };
        break;
      case 'worldwide':
        setWorldWideMade(value);
        // Reset Chinese sub-option if turning off worldwide
        const newChineseMade = value ? chineseMade : false;
        setChineseMade(newChineseMade);
        updatedFilters = {
          usaMade: usaMade,
          americasMade: americasMade,
          worldWideMade: value,
          chineseMade: newChineseMade
        };
        break;
      case 'chinese':
        setChineseMade(value);
        updatedFilters = {
          usaMade: usaMade,
          americasMade: americasMade,
          worldWideMade: worldWideMade,
          chineseMade: value
        };
        break;
      default:
        break;
    }

    // Log changes to help with debugging
    console.log(`OriginFilter: Changed ${filterType} to ${value}`, updatedFilters);
    
    // Pass filter state to parent component
    onFilterChange(updatedFilters);
  };

  return (
    <div className={styles.originFilterContainer}>
      <h3 className={styles.filterTitle}>Source</h3>
      <div className={styles.filterOptions}>
        <div className={styles.filterOption}>
          <input
            type="checkbox"
            id="usa-made"
            checked={usaMade}
            onChange={(e) => handleFilterChange('usa', e.target.checked)}
          />
          <label htmlFor="usa-made">USA-Made</label>
        </div>
        <div className={styles.filterOption}>
          <input
            type="checkbox"
            id="americas-made"
            checked={americasMade}
            onChange={(e) => handleFilterChange('americas', e.target.checked)}
          />
          <label htmlFor="americas-made">Made in the Americas</label>
        </div>
        <div className={styles.filterOption}>
          <input
            type="checkbox"
            id="worldwide-made"
            checked={worldWideMade}
            onChange={(e) => handleFilterChange('worldwide', e.target.checked)}
          />
          <label htmlFor="worldwide-made">Made World-Wide</label>
        </div>
        {worldWideMade && (
          <div className={`${styles.filterOption} ${styles.subFilterOption}`}>
            <input
              type="checkbox"
              id="chinese-made"
              checked={chineseMade}
              onChange={(e) => handleFilterChange('chinese', e.target.checked)}
            />
            <label htmlFor="chinese-made">Chinese-Made Products</label>
          </div>
        )}
      </div>
    </div>
  );
};

export default OriginFilter; 