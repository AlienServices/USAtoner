import { processCatalog } from './processToner.mjs'
import fs from 'fs/promises'
import path from 'path'
import { parse } from 'csv-parse'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function testProcessing() {
  try {
    // First, let's look at unique manufacturers in the data
    const filePath = path.join(process.cwd(), 'public', 'data', 'ecatalog.csv')
    const fileContent = await fs.readFile(filePath, 'utf-8')
    
    const manufacturers = new Set()
    
    // Parse and collect all unique MachMfc values
    const records = await new Promise((resolve, reject) => {
      const results = []
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      }, (err, records) => {
        if (err) reject(err)
        records.forEach(record => {
          if (record.MachMfc) {
            manufacturers.add(record.MachMfc)
          }
        })
        resolve(records)
      })
    })

    console.log('Unique manufacturers found:', Array.from(manufacturers).sort())
    
    // Test the actual processing
    const sortedData = await processCatalog()
    
    // Log results
    console.log('\nProcessing Results:')
    for (const [brand, items] of Object.entries(sortedData)) {
      console.log(`${brand}: ${items.length} items`)
    }
    
    // Log unmatched manufacturers
    console.log('\nUnmatched manufacturers:')
    const unmatchedMfcs = new Set(
      records
        .filter(record => {
          const mfc = record.MachMfc?.toLowerCase() || ''
          return !Object.keys(sortedData).some(brand => 
            mfc.includes(brand) || 
            (brand === 'hp' && mfc.includes('hewlett'))
          )
        })
        .map(record => record.MachMfc)
    )
    console.log(Array.from(unmatchedMfcs).sort())

  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Run the test
testProcessing() 