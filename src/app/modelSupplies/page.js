import Data from './data'
import { Suspense } from 'react'

export const metadata = {
    title: 'Konica Minolta Supplies | USA Toner',
    description: 'Find all supplies for your Konica Minolta printer including toner, waste toner box, imaging units, and more.',
    keywords: "konica minolta supplies, konica minolta toner, konica minolta waste toner box, konica minolta imaging units"
}

const ModelSupplies = () => {
    return (
        <Suspense>
            <Data />
        </Suspense>
    )
}

export default ModelSupplies 