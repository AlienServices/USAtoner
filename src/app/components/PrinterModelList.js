"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../page.module.css';

const PrinterModelList = ({ models, brandName }) => {
  const [selectedSeries, setSelectedSeries] = useState('all');
  
  // Extract unique series from models
  const seriesList = ['all', ...new Set(models.map(model => model.series).filter(series => series))];
  
  // Filter models by selected series
  const filteredModels = selectedSeries === 'all' 
    ? models 
    : models.filter(model => model.series === selectedSeries);
  
  // Group models by first letter/number for alphabetical display
  const groupedModels = filteredModels.reduce((acc, model) => {
    const firstChar = model.model.charAt(0).toUpperCase();
    if (!acc[firstChar]) {
      acc[firstChar] = [];
    }
    acc[firstChar].push(model);
    return acc;
  }, {});
  
  // Sort the keys alphabetically
  const sortedGroups = Object.keys(groupedModels).sort();

  return (
    <div className={styles.modelListContainer}>
      <h2 className={styles.brandTitle}>{brandName} Printer Models</h2>
      
      {/* Series filter */}
      <div className={styles.seriesFilter}>
        <span className={styles.filterLabel}>Filter by Series:</span>
        <div className={styles.seriesOptions}>
          {seriesList.map(series => (
            <button 
              key={series} 
              className={`${styles.seriesButton} ${selectedSeries === series ? styles.activeSeriesButton : ''}`}
              onClick={() => setSelectedSeries(series)}
            >
              {series === 'all' ? 'All Series' : series}
            </button>
          ))}
        </div>
      </div>
      
      {/* Alphabetical index */}
      <div className={styles.alphabetIndex}>
        {sortedGroups.map(letter => (
          <a 
            key={letter} 
            href={`#section-${letter}`}
            className={styles.indexLink}
          >
            {letter}
          </a>
        ))}
      </div>
      
      {/* Models by group */}
      <div className={styles.modelGroups}>
        {sortedGroups.map(letter => (
          <div key={letter} id={`section-${letter}`} className={styles.modelGroup}>
            <h3 className={styles.groupTitle}>{letter}</h3>
            <div className={styles.modelGrid}>
              {groupedModels[letter].map(model => (
                <div key={model.model} className={styles.modelCard}>
                  <h4 className={styles.modelName}>
                    {model.series ? `${model.series} ` : ''}{model.model}
                  </h4>
                  <div className={styles.modelYear}>
                    {model.year > 0 ? `Released: ${model.year}` : ''}
                  </div>
                  <div className={styles.suppliesCount}>
                    {model.products.length} supplies available
                  </div>
                  <Link 
                    href={`/${brandName.toLowerCase()}/model/${encodeURIComponent(model.model)}`}
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
};

export default PrinterModelList; 