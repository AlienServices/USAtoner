"use client"
import React, { useState } from 'react';
import styles from '../page.module.css';

const OriginFilter = ({ onFilterChange }) => {
  const [usaMade, setUsaMade] = useState(false);
  const [americasMade, setAmericasMade] = useState(false);
  const [worldWideMade, setWorldWideMade] = useState(false);
  const [chineseMade, setChineseMade] = useState(false);

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'usa':
        setUsaMade(value);
        break;
      case 'americas':
        setAmericasMade(value);
        break;
      case 'worldwide':
        setWorldWideMade(value);
        break;
      case 'chinese':
        setChineseMade(value);
        break;
      default:
        break;
    }

    // Pass filter state to parent component
    onFilterChange({
      usaMade: filterType === 'usa' ? value : usaMade,
      americasMade: filterType === 'americas' ? value : americasMade,
      worldWideMade: filterType === 'worldwide' ? value : worldWideMade,
      chineseMade: filterType === 'chinese' ? value : chineseMade
    });
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