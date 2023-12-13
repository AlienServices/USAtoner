import styles from "../styles/Header.module.css";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useRef, useState, useContext } from "react";
import Image from "next/image";
export default function Header() {
  const router = useRouter();

  return (
    <div>
      <header className={styles.contactHeader}>
        <div className={styles.logoSpaceContainer}>
          <div className={styles.logoSpace}>
            <div className={styles.logoContainer}>
              <Link href={'/'}>
                <Image
                  src="/static/download.png"
                  alt="buy a used or new business copier"
                  fill={true}
                />
              </Link>
            </div>
            <div className={styles.pieceContainer}>
              <Link href="/epson">
                <div className={styles.headerPieces}>Epson</div>
                <div className={styles.lineSmall}></div>
              </Link>
            </div>
            <div className={styles.pieceContainer}>
              <Link href="/konika">
                <div className={styles.headerPieces}>Konika</div>
                <div className={styles.lineSmall}></div>
              </Link>
            </div>
            <div className={styles.pieceContainer}>
              <Link href="/hp">
                <div className={styles.headerPieces}>HP</div>
                <div className={styles.lineSmall}></div>
              </Link>
            </div>
            <div className={styles.pieceContainer}>
              <Link href="/lexmark">
                <div className={styles.headerPieces}>Lexmark</div>
                <div className={styles.lineSmall}></div>
              </Link>
            </div>
            <div className={`${styles.pieceContainer} ${styles.hidden}`}>
              <Link href="/xerox">
                <div className={styles.headerPieces}>Xerox</div>
                <div className={styles.lineSmall}></div>
              </Link>
            </div>
            <div className={`${styles.pieceContainer} ${styles.hidden}`}>
              <Link href="/hp">
                <div className={styles.headerPieces}>HP</div>
                <div className={styles.lineSmall}></div>
              </Link>
            </div>
            <div className={`${styles.pieceContainer} ${styles.hidden}`}>
              <Link href="/dell">
                <div className={styles.headerPieces}>Dell</div>
                <div className={styles.lineSmall}></div>
              </Link>
            </div>

            <div className={styles.pieceContainer}>
              <Link href="/buy">
                <div className={styles.headerPieces}>Contact Us</div>
                <div className={styles.lineSmall}></div>
              </Link>
            </div>
            <div className={styles.cartContainer}>
              <Image
                src="/static/cart.webp"
                alt="buy a used or new business copier"
                fill={true}
              />
            </div>
            {/* <div className={styles.cartNumber}>{cart.length}</div> */}
          </div>
        </div >
        <div className={styles.line}></div>
        <div className={styles.headerContainer}>
        </div>
      </header >
    </div>
  );
}
