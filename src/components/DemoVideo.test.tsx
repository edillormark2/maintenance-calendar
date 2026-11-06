import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DemoVideo } from './DemoVideo'

describe('DemoVideo', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
    vi.clearAllMocks()
  })

  it('puts no video in the page until it is opened, then plays it, and closes', async () => {
    const user = userEvent.setup()
    const { container } = render(<DemoVideo />)
    expect(container.querySelector('video')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Watch the 1-minute demo' }))

    const dialog = container.querySelector('dialog')
    expect(dialog).toHaveAttribute('open')
    expect(container.querySelector('video')).toHaveAttribute('src', '/demo.mp4')
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(dialog).not.toHaveAttribute('open')
    expect(container.querySelector('video')).toBeNull()
  })

  it('opens without playing when the address ends in #demo', () => {
    window.history.replaceState(null, '', '/#demo')
    const { container } = render(<DemoVideo />)
    expect(container.querySelector('dialog')).toHaveAttribute('open')
    expect(container.querySelector('video')).toHaveAttribute('poster', '/demo-poster.jpg')
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
  })
})
