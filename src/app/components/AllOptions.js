import Image from 'next/image'
import styles from '../styles/Header.module.css'

export default function AllOptions() {
    return (
        <div className={styles.Flex}>
            <div style={{ width: '17%' }} className={styles.iconFlex}>
                <div className={styles.black}>All Options</div>
                <Image height={30} width={30} src={'/static/arrow-right.webp'} />
            </div>
        </div >
    )
}
