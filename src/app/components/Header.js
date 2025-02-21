import styles from "../styles/Header.module.css";
import Link from "next/link";
import React from "react";

export default function Header() {
  return (
    <div>
      <header className={styles.contactHeader}>
        <div className={styles.logoSpaceContainer}>
          <div className={styles.logoSpace}>
            <div className={styles.logoContainer}>
              <Link href={'/'}>
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5'
                }}>
                  USA Toner
                </div>
              </Link>
            </div>
            <div className={styles.pieceContainer}>
              <Link href="/konika">
                <div className={styles.headerPieces}>Konica</div>
                <div className={styles.lineSmall}></div>
              </Link>
            </div>
            <div className={styles.pieceContainer}>
              <Link href="/lexmark">
                <div className={styles.headerPieces}>Lexmark</div>
                <div className={styles.lineSmall}></div>
              </Link>
            </div>
            <div className={`${styles.pieceContainer}`}>
              <Link href="/xerox">
                <div className={styles.headerPieces}>Xerox</div>
                <div className={styles.lineSmall}></div>
              </Link>
            </div>
            <div className={`${styles.pieceContainer}`}>
              <Link href="/hp">
                <div className={styles.headerPieces}>HP</div>
                <div className={styles.lineSmall}></div>
              </Link>
            </div>
            <div className={`${styles.pieceContainer}`}>
              <Link href="/dell">
                <div className={styles.headerPieces}>Dell</div>
                <div className={styles.lineSmall}></div>
              </Link>
            </div>
            <Link href={'/carts'}>
              <div className={styles.cartContainer}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  🛒
                </div>
              </div>
            </Link>
          </div>
        </div>
        <div className={styles.line}></div>
        <div className={styles.headerContainer}>
        </div>
      </header>
    </div>
  );
}
