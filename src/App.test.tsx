import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { parsePortfolio, type Portfolio } from './data/portfolio'
import { DUE_SOON_DAYS } from './lib/schedule'
import { fixture, TODAY } from './test/fixtures'

function renderApp(portfolio: Portfolio = fixture, date = TODAY) {
  const user = userEvent.setup()
  render(<App portfolio={portfolio} today={{ date, fromAddressBar: false }} />)
  return user
}

/** A task's table row. Rows are named after their content, which starts with the task. */
const rowOf = (task: string) => screen.getByRole('row', { name: new RegExp(`^${task}`) })

/** The Mark done buttons in page order; each names its task and property. */
const markDoneButtons = () =>
  screen.queryAllByRole('button', { name: /^Mark done/ }).map((button) => button.textContent)

describe('App', () => {
  it('lists each task under its property, the most overdue property and task first', () => {
    renderApp()
    expect(markDoneButtons()).toEqual([
      'Mark done: Fire alarm inspection, Cedar Court',
      'Mark done: HVAC filter change, Cedar Court',
      'Mark done: Roof inspection, Cedar Court',
      'Mark done: Elevator inspection, Bay Plaza',
      'Mark done: Landscaping service, Bay Plaza',
    ])

    const fireAlarm = rowOf('Fire alarm inspection')
    expect(within(fireAlarm).getByText('Oct 1, 2026')).toBeInTheDocument()
    expect(within(fireAlarm).getByText('37 days overdue')).toBeInTheDocument()

    expect(screen.getByRole('radio', { name: 'Overdue 2' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: `Next ${DUE_SOON_DAYS} days 2` })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Later 1' })).toBeInTheDocument()
  })

  it('sorts the properties by name when asked', async () => {
    const user = renderApp()
    await user.selectOptions(screen.getByRole('combobox', { name: /Sort by/ }), 'Property name')
    expect(markDoneButtons()[0]).toBe('Mark done: Elevator inspection, Bay Plaza')
  })

  it('marks a task done, moving its next due date a cycle on from today, and Undo puts it back', async () => {
    const user = renderApp()
    const fireAlarm = rowOf('Fire alarm inspection')

    await user.click(within(fireAlarm).getByRole('button', { name: /Mark done/ }))

    expect(within(fireAlarm).getByText('Nov 7, 2026')).toBeInTheDocument()
    expect(within(fireAlarm).getByText('Nov 7, 2027')).toBeInTheDocument()
    expect(within(fireAlarm).getByText('Due in 365 days')).toBeInTheDocument()
    expect(within(fireAlarm).getByText('Done today')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Overdue 1' })).toBeInTheDocument()
    expect(screen.getByText(/marked done/)).toHaveTextContent(
      'Fire alarm inspection at Cedar Court marked done. Next due Nov 7, 2027.',
    )
    // The button the user pressed is gone, so focus moves to Undo.
    expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Undo' }))

    expect(within(fireAlarm).getByText('Oct 1, 2026')).toBeInTheDocument()
    expect(within(fireAlarm).getByText('37 days overdue')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Overdue 2' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
    expect(within(fireAlarm).getByRole('button', { name: /Mark done/ })).toHaveFocus()
  })

  it('keeps the change when the message is closed with Escape, and returns focus to the task', async () => {
    const user = renderApp()
    const elevator = rowOf('Elevator inspection')

    await user.click(within(elevator).getByRole('button', { name: /Mark done/ }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
    expect(within(elevator).getByText('Nov 7, 2027')).toBeInTheDocument()
    expect(within(elevator).getByText('Done today')).toHaveFocus()
  })

  it('offers nothing to mark on a task already done today or dated later', () => {
    renderApp(fixture, '2026-09-01')
    expect(within(rowOf('Roof inspection')).getByText('Done today')).toBeInTheDocument()
    expect(within(rowOf('Landscaping service')).getByText('Done')).toBeInTheDocument()
    expect(within(rowOf('Landscaping service')).queryByRole('button')).not.toBeInTheDocument()
  })

  it('filters by status, property and category, and explains an empty result', async () => {
    const user = renderApp()

    await user.click(screen.getByRole('radio', { name: 'Overdue 2' }))
    expect(markDoneButtons()).toHaveLength(2)
    expect(screen.getByText('Showing 2 of 5 tasks')).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: /Property/ }), 'Bay Plaza')
    expect(markDoneButtons()).toEqual(['Mark done: Elevator inspection, Bay Plaza'])
    expect(screen.getByRole('radio', { name: `Next ${DUE_SOON_DAYS} days 1` })).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Later 0' }))
    expect(screen.getByText(`Nothing is due more than ${DUE_SOON_DAYS} days out`)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show all tasks' }))
    expect(markDoneButtons()).toHaveLength(5)

    await user.selectOptions(screen.getByRole('combobox', { name: /Category/ }), 'HVAC')
    expect(markDoneButtons()).toEqual(['Mark done: HVAC filter change, Cedar Court'])

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(markDoneButtons()).toHaveLength(5)
  })

  it('checks the date again when the tab comes back into view', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      renderApp()
      vi.setSystemTime(new Date(2026, 10, 8, 8, 0))
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'))
      })
      expect(screen.getByText('Sunday, November 8, 2026')).toBeInTheDocument()
      expect(within(rowOf('Fire alarm inspection')).getByText('38 days overdue')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('lists rows the data files could not supply', () => {
    renderApp(
      parsePortfolio(
        {
          name: 'properties.csv',
          text: 'property_id,property_name,city,state\nP1,Maple Crossing,Greenville,SC',
        },
        {
          name: 'items.csv',
          text: 'item_id,property_id,task,category,frequency_months,last_completed\n1,P1,Pest control,General,1,2026-02-30',
        },
      ),
    )
    expect(
      screen.getByRole('heading', { name: 'Some rows in the data files were skipped' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/items\.csv line 2: last_completed should be a real date/)).toBeInTheDocument()
    expect(screen.getByText('The rows listed above need fixing first.')).toBeInTheDocument()
  })

  it('says so when the maintenance file has no tasks', () => {
    renderApp(
      parsePortfolio(
        {
          name: 'properties.csv',
          text: 'property_id,property_name,city,state\nP1,Maple Crossing,Greenville,SC',
        },
        { name: 'items.csv', text: 'item_id,property_id,task,category,frequency_months,last_completed\n' },
      ),
    )
    expect(screen.getByText('The maintenance file has no tasks in it yet.')).toBeInTheDocument()
  })
})
