import { parse } from 'csv-parse'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function processCatalog() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'ecatalog.csv')
    const fileContent = await fs.readFile(filePath, 'utf-8')
    
    const brands = {
      hp: [],
      dell: [],
      brother: [],
      canon: [],
      epson: [],
      lexmark: [],
      konika: [],
      samsung: [],
      xerox: [],
      ricoh: [],
      kyocera: [],
      toshiba: [],
      sharp: [],
      okidata: [],
      panasonic: [],
      ibm: [],
      apple: [],
      kodak: [],
    }

    return new Promise((resolve, reject) => {
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      }, (err, records) => {
        if (err) reject(err)

        records.forEach(record => {
          const manufacturer = record.MachMfc?.toLowerCase() || ''
          
          let brand = null
          if (manufacturer.includes('brother')) brand = 'brother'
          else if (manufacturer.includes('hp') || manufacturer.includes('hewlett')) brand = 'hp'
          else if (manufacturer.includes('dell')) brand = 'dell'
          else if (manufacturer.includes('canon')) brand = 'canon'
          else if (manufacturer.includes('epson')) brand = 'epson'
          else if (manufacturer.includes('lexmark')) brand = 'lexmark'
          else if (manufacturer.includes('konica')) brand = 'konika'
          else if (manufacturer.includes('samsung')) brand = 'samsung'
          else if (manufacturer.includes('xerox')) brand = 'xerox'
          else if (manufacturer.includes('ricoh')) brand = 'ricoh'
          else if (manufacturer.includes('kyocera')) brand = 'kyocera'
          else if (manufacturer.includes('toshiba')) brand = 'toshiba'
          else if (manufacturer.includes('sharp')) brand = 'sharp'
          else if (manufacturer.includes('okidata')) brand = 'okidata'
          else if (manufacturer.includes('panasonic')) brand = 'panasonic'
          else if (manufacturer.includes('ibm')) brand = 'ibm'
          else if (manufacturer.includes('apple')) brand = 'apple'
          else if (manufacturer.includes('kodak')) brand = 'kodak'
          
          if (brand && brands.hasOwnProperty(brand)) {
            brands[brand].push(record)
          }
        })

        resolve(brands)
      })
    })
  } catch (error) {
    console.error('Error processing catalog:', error)
    throw error
  }
} 