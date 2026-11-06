import { describe, expect, it } from 'vitest'
import { loadPortfolio, parsePortfolio } from './portfolio'
import maintenanceItemsCsv from './sample_maintenance_items.csv?raw'
import propertiesCsv from './sample_properties.csv?raw'

const PROPERTIES = {
  name: 'properties.csv',
  text: 'property_id,property_name,city,state\nP1,Maple Crossing,Greenville,SC\n',
}
const ITEMS_HEADER = 'item_id,property_id,task,category,frequency_months,last_completed'

function itemsFile(...rows: string[]) {
  return { name: 'items.csv', text: [ITEMS_HEADER, ...rows].join('\n') }
}

describe('loadPortfolio', () => {
  // Counts the lines with data in a file, so adding a row to a sample file doesn't break this test.
  const dataLines = (text: string) => text.split('\n').filter((line) => line.trim() !== '').length - 1

  it('reads every row of both sample files without problems', () => {
    const { properties, items, problems } = loadPortfolio()
    expect(problems).toEqual([])
    expect(properties).toHaveLength(dataLines(propertiesCsv))
    expect(items).toHaveLength(dataLines(maintenanceItemsCsv))
    expect(items[0]).toEqual({
      id: '1',
      propertyId: 'P1',
      task: 'Fire alarm inspection',
      category: 'Fire and life safety',
      frequencyMonths: 12,
      lastCompleted: '2025-11-03',
    })
  })
})

describe('parsePortfolio', () => {
  it('reads columns by name, in any order, and copes with spreadsheet exports', () => {
    const byteOrderMark = String.fromCharCode(0xfeff)
    const text =
      byteOrderMark +
      'last_completed,task,item_id,property_id,category,frequency_months\r\n' +
      '2026-08-31,"HVAC filter change, all units",3,P1,HVAC,3\r\n'
    const { items, problems } = parsePortfolio(PROPERTIES, { name: 'items.csv', text })
    expect(problems).toEqual([])
    expect(items).toEqual([
      {
        id: '3',
        propertyId: 'P1',
        task: 'HVAC filter change, all units',
        category: 'HVAC',
        frequencyMonths: 3,
        lastCompleted: '2026-08-31',
      },
    ])
  })

  it('skips and explains rows it cannot trust, and keeps the rest', () => {
    const { items, problems } = parsePortfolio(
      PROPERTIES,
      itemsFile(
        '1,P1,Fire alarm inspection,Fire and life safety,12,2025-11-03',
        '2,P1,Landscaping service,Grounds,1,2026-02-30',
        '3,P1,HVAC filter change,HVAC,quarterly,2026-08-31',
        '4,P9,Roof inspection,Roof,6,2026-05-20',
        '1,P1,Pest control,General,1,2026-10-05',
        '5,P1,Gutter cleaning,Roof,6',
        '6,P1,,Roof,6,2026-07-10',
      ),
    )
    expect(items.map((item) => item.id)).toEqual(['1'])
    expect(problems).toEqual([
      'items.csv line 3: last_completed should be a real date like 2026-01-31 (found "2026-02-30"). This row was skipped.',
      'items.csv line 4: frequency_months should be a whole number from 1 to 120 (found "quarterly"). This row was skipped.',
      `items.csv line 5: property_id "P9" isn't in properties.csv. This row was skipped.`,
      'items.csv line 6: item_id 1 is used twice. This row was skipped.',
      'items.csv line 7: expected 6 values but found 5. This row was skipped.',
      'items.csv line 8: task is empty. This row was skipped.',
    ])
  })

  it.each(['0', '-1', '1.5', '', '121', '120000'])('rejects a frequency of "%s"', (frequency) => {
    const { items, problems } = parsePortfolio(
      PROPERTIES,
      itemsFile(`1,P1,Pest control,General,${frequency},2026-10-05`),
    )
    expect(items).toEqual([])
    expect(problems).toHaveLength(1)
  })

  it('reports a missing column instead of guessing', () => {
    const { items, problems } = parsePortfolio(PROPERTIES, {
      name: 'items.csv',
      text: 'item_id,property_id,task,category,frequency_months\n1,P1,Pest control,General,1\n',
    })
    expect(items).toEqual([])
    expect(problems).toEqual(['items.csv has no last_completed column, so none of its rows could be read.'])
  })

  it('ignores blank lines', () => {
    const { items, problems } = parsePortfolio(
      PROPERTIES,
      itemsFile('', '1,P1,Pest control,General,1,2026-10-05', '', ''),
    )
    expect(problems).toEqual([])
    expect(items).toHaveLength(1)
  })
})
