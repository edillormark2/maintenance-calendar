import { parsePortfolio } from '../data/portfolio'

export const TODAY = '2026-11-07'

/**
 * A small portfolio for the page and filter tests, kept apart from the sample
 * CSV files so that editing those can't break these tests. As of TODAY:
 *
 *   Cedar Court  Fire alarm inspection   due Oct 1, 2026   37 days overdue
 *                HVAC filter change      due Nov 12, 2026  in 5 days
 *                Roof inspection         due Mar 1, 2027   in 114 days
 *   Bay Plaza    Elevator inspection     due Nov 4, 2026   3 days overdue
 *                Landscaping service     due Nov 9, 2026   in 2 days
 */
export const fixture = parsePortfolio(
  {
    name: 'properties.csv',
    text: [
      'property_id,property_name,city,state',
      'A,Cedar Court,Greenville,SC',
      'B,Bay Plaza,Charleston,SC',
    ].join('\n'),
  },
  {
    name: 'items.csv',
    // Listed least urgent first, so the tests prove the app does the sorting.
    text: [
      'item_id,property_id,task,category,frequency_months,last_completed',
      '3,A,Roof inspection,Roof,6,2026-09-01',
      '2,A,HVAC filter change,HVAC,3,2026-08-12',
      '1,A,Fire alarm inspection,Fire and life safety,12,2025-10-01',
      '5,B,Landscaping service,Grounds,1,2026-10-09',
      '4,B,Elevator inspection,Elevator,12,2025-11-04',
    ].join('\n'),
  },
)
