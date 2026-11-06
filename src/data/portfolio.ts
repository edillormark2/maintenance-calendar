import Papa from 'papaparse'
import { parseIsoDate } from '../lib/dates'
import { plural } from '../lib/format'
import type { MaintenanceItem, Property } from '../types'
import maintenanceItemsCsv from './sample_maintenance_items.csv?raw'
import propertiesCsv from './sample_properties.csv?raw'

export interface CsvFile {
  name: string
  text: string
}

export interface Portfolio {
  properties: Property[]
  items: MaintenanceItem[]
  /** Rows that couldn't be used, each explained so someone can fix the file. */
  problems: string[]
}

/** Ten years: anything longer is almost certainly a typo. */
const MAX_FREQUENCY_MONTHS = 120

/**
 * Reads the two CSV files that ship with the app. Vite bundles them as text
 * (the ?raw imports above). To read from an API later, fetch the same data
 * and keep the checks in parsePortfolio.
 */
export function loadPortfolio(): Portfolio {
  return parsePortfolio(
    { name: 'sample_properties.csv', text: propertiesCsv },
    { name: 'sample_maintenance_items.csv', text: maintenanceItemsCsv },
  )
}

/**
 * Turns the CSV text into typed records. A row that can't be trusted is
 * skipped and reported, rather than stopping the whole app or being guessed at.
 */
export function parsePortfolio(propertiesFile: CsvFile, itemsFile: CsvFile): Portfolio {
  const problems: string[] = []
  const properties = readProperties(propertiesFile, problems)
  const propertyIds = new Set(properties.map((property) => property.id))
  const items = readItems(itemsFile, propertiesFile.name, propertyIds, problems)
  return { properties, items, problems }
}

const PROPERTY_COLUMNS = ['property_id', 'property_name', 'city', 'state']
const ITEM_COLUMNS = ['item_id', 'property_id', 'task', 'category', 'frequency_months', 'last_completed']

function readProperties(file: CsvFile, problems: string[]): Property[] {
  const properties: Property[] = []
  const seenIds = new Set<string>()

  for (const row of readRows(file, PROPERTY_COLUMNS, problems)) {
    if (row.shapeIssue) {
      problems.push(skipped(row, [row.shapeIssue]))
      continue
    }
    const id = row.get('property_id')
    const name = row.get('property_name')

    const issues: string[] = []
    if (!id) issues.push('property_id is empty')
    else if (seenIds.has(id)) issues.push(`property_id ${id} is used twice`)
    if (!name) issues.push('property_name is empty')
    if (issues.length > 0) {
      problems.push(skipped(row, issues))
      continue
    }

    seenIds.add(id)
    properties.push({ id, name, city: row.get('city'), state: row.get('state') })
  }
  return properties
}

function readItems(
  file: CsvFile,
  propertiesFileName: string,
  propertyIds: Set<string>,
  problems: string[],
): MaintenanceItem[] {
  const items: MaintenanceItem[] = []
  const seenIds = new Set<string>()

  for (const row of readRows(file, ITEM_COLUMNS, problems)) {
    if (row.shapeIssue) {
      problems.push(skipped(row, [row.shapeIssue]))
      continue
    }
    const id = row.get('item_id')
    const propertyId = row.get('property_id')
    const task = row.get('task')
    const category = row.get('category')
    const frequencyMonths = parseWholeNumber(row.get('frequency_months'))
    const lastCompleted = parseIsoDate(row.get('last_completed'))

    const issues: string[] = []
    if (!id) issues.push('item_id is empty')
    else if (seenIds.has(id)) issues.push(`item_id ${id} is used twice`)
    if (!propertyIds.has(propertyId)) {
      issues.push(`property_id "${propertyId}" isn't in ${propertiesFileName}`)
    }
    if (!task) issues.push('task is empty')
    if (!category) issues.push('category is empty')
    if (frequencyMonths === null || frequencyMonths < 1 || frequencyMonths > MAX_FREQUENCY_MONTHS) {
      issues.push(
        `frequency_months should be a whole number from 1 to ${MAX_FREQUENCY_MONTHS} (found "${row.get('frequency_months')}")`,
      )
    }
    if (lastCompleted === null) {
      issues.push(
        `last_completed should be a real date like 2026-01-31 (found "${row.get('last_completed')}")`,
      )
    }
    // The null checks repeat the ones above so TypeScript knows both values are set below.
    if (issues.length > 0 || frequencyMonths === null || lastCompleted === null) {
      problems.push(skipped(row, issues))
      continue
    }

    seenIds.add(id)
    items.push({ id, propertyId, task, category, frequencyMonths, lastCompleted })
  }
  return items
}

interface Row {
  file: string
  /** Line number in the file, counting the header as line 1. */
  line: number
  /** Set when the line has too few or too many values to be read at all. */
  shapeIssue?: string
  get(column: string): string
}

/**
 * Parses a file into rows that read their values by column name, so the
 * column order doesn't matter. Blank lines are left out. If the file is
 * missing a column, none of its rows can be trusted, so it returns none.
 */
function readRows(file: CsvFile, columns: string[], problems: string[]): Row[] {
  // PapaParse also drops the byte order mark that spreadsheet apps often save at the start of a CSV.
  const { data: lines, errors } = Papa.parse<string[]>(file.text, { delimiter: ',', skipEmptyLines: false })
  for (const error of errors) {
    problems.push(`${file.name}${error.row === undefined ? '' : ` line ${error.row + 1}`}: ${error.message}`)
  }

  const header = (lines[0] ?? []).map((name) => name.trim().toLowerCase())
  const missing = columns.filter((column) => !header.includes(column))
  if (missing.length > 0) {
    problems.push(
      `${file.name} has no ${missing.join(', ')} ${missing.length === 1 ? 'column' : 'columns'}, so none of its rows could be read.`,
    )
    return []
  }

  const rows: Row[] = []
  lines.forEach((cells, index) => {
    if (index === 0 || cells.every((cell) => cell.trim() === '')) return
    rows.push({
      file: file.name,
      line: index + 1,
      shapeIssue:
        cells.length === header.length
          ? undefined
          : `expected ${plural(header.length, 'value')} but found ${cells.length}`,
      get: (column) => cells[header.indexOf(column)].trim(),
    })
  })
  return rows
}

function skipped(row: Row, issues: string[]): string {
  return `${row.file} line ${row.line}: ${issues.join('; ')}. This row was skipped.`
}

function parseWholeNumber(value: string): number | null {
  return /^\d+$/.test(value) ? Number(value) : null
}
