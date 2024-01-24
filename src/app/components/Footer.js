import styles from "../styles/Footer.module.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
export default function Footer() {
  const router = useRouter();
  return (
    <div className={styles.footer}>
      <div className={styles.smallerContainer}>
        <div className={styles.exploreContainerGood}>
          <div style={{ paddingBottom: "15px" }} className={styles.exploreContainerGood}>
            <Image alt={"download logo"} src={"/static/noBackground.png"} fill={true} />
          </div>

          <div className={styles.footerTags}>
            At USA Toner we promise transparent pricing

          </div>
          <div style={{ paddingBottom: "30px" }} className={styles.footerTags}>
            high-quality equipment, and exceptional service

          </div>
          <div className={styles.even}>
            <a href="https://www.facebook.com/copiersforlessutah/">
              <Image alt={'facebook logo'} src={'/static/facebook.webp'} width={20} height={20} />
            </a>
            <a href="https://www.linkedin.com/in/copiers-utah-5b2b85148/">
              <Image alt={"linkedin logo"} src={'/static/linkedin.webp'} width={20} height={20} />
            </a>
            <a href="https://twitter.com/CopiersUtahReal">
              <Image alt={'twitter logo'} src={'/static/twitter.webp'} width={20} height={20} />
            </a>
            <a href="https://www.facebook.com/copiersforlessutah/">
              <Image alt={"facebook logo"} src={'/static/facebook.webp'} width={20} height={20} />
            </a>
            <a href="https://www.youtube.com/channel/UCnn6gVWPfQc5_q-CozIZAxA">
              <Image alt={"youtube logo"} src={'/static/youtube.webp'} width={20} height={20} />
            </a>
          </div>
        </div>
        <div className={styles.line}></div>
        <div className={styles.exploreContainer}>
          <div className={styles.footerTitle}>Popular Brands</div>
          <Link href="/buy">
            <div className={styles.h4}>Konica </div>
          </Link>
          <Link href="/shortTerm">
            <div className={styles.h4}>Lexmark </div>
          </Link>
          <Link href="/fix">
            <div className={styles.h4}>HP </div>
          </Link>
          <Link href="/fix">
            <div className={styles.h4}>Xerox </div>
          </Link>
          <Link href="/finance">
            <div className={styles.h4}>Dell </div>
          </Link>
        </div>
        <div className={styles.line}></div>
        <div className={styles.exploreContainer2}>
          <div style={{ paddingBottom: "3px" }} className={styles.footerTitle}>Contact Us</div>
          <div style={{ paddingBottom: "10px" }} className={styles.footerContainer}>
            <div style={{ fontSize: "13px", fontWeight: "200" }}>USA Toner</div>
            <div style={{ fontSize: "13px", fontWeight: "200" }}>We have Toner For Sale!</div>
            <div style={{ fontSize: "13px", fontWeight: "200" }}>554 W 8360 S</div>
            <div style={{ fontSize: "13px", fontWeight: "200" }}>Sandy, UT 84070</div>
          </div>
          <div >
            <div className={styles.flex}>
              <div style={{ paddingRight: "10px" }}>
                <Image alt={"phone logo"} src={'/static/phone.png'} width={20} height={20} />
              </div>
              <div style={{ fontSize: "13px", fontWeight: "200" }}>Call us at (801)-261 0510 </div>
            </div>
            <div className={styles.flex}>
              <div style={{ paddingRight: "10px" }}>
                <Image alt={'mail logo'} src={'/static/mail.png'} width={20} height={20} />
              </div>
              <div style={{ fontSize: "13px", fontWeight: "200" }}>Info@copiersutah.com</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
