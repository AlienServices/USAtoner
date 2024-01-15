import Image from 'next/image'
import styles from '../page.module.css'

export default function BestSellers() {
    return (
        <div className={styles.flexSmall}>
            <div className={styles.iconFlex}>
                <div className={styles.black}>Best Sellers</div>
                <Image alt={'right arrow logo'} height={30} width={30} src={'/static/arrow-right.webp'} />
            </div>
        </div >
    )
}
