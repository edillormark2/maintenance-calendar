import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { CloseIcon, PlayIcon } from './icons'

const VIDEO = '/demo.mp4'
const POSTER = '/demo-poster.jpg'
const CAPTIONS = '/demo.vtt'

/**
 * A one-minute narrated walkthrough of the app, opened from a small button under the title.
 * The video isn't in the page until someone opens it, so it costs the page nothing before then.
 * A link ending in #demo opens it straight away.
 */
export function DemoVideo() {
  const dialog = useRef<HTMLDialogElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [open, setOpen] = useState(() => window.location.hash === '#demo')

  // Opened by a #demo link: show it, but wait for a press of play (browsers won't start sound unasked).
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal()
  }, [open])

  function watch() {
    // flushSync puts the video in the page now, so play() still counts as the click's doing.
    flushSync(() => setOpen(true))
    dialog.current?.showModal()
    video.current?.play()?.catch(() => {})
  }

  return (
    <>
      <button type="button" className="demo-link" onClick={watch}>
        <span className="demo-link-icon">
          <PlayIcon />
        </span>
        Watch the 1-minute demo
      </button>

      <dialog
        ref={dialog}
        className="demo-dialog"
        aria-labelledby="demo-title"
        onClose={() => setOpen(false)}
      >
        <div className="demo-panel">
          <div className="demo-head">
            <h2 id="demo-title">Preventative maintenance calendar · 1-minute walkthrough</h2>
            <button
              type="button"
              className="demo-close"
              aria-label="Close"
              onClick={() => dialog.current?.close()}
            >
              <CloseIcon />
            </button>
          </div>
          {open && (
            <video
              ref={video}
              className="demo-video"
              src={VIDEO}
              poster={POSTER}
              controls
              playsInline
              preload="metadata"
            >
              <track kind="captions" src={CAPTIONS} srcLang="en" label="English" />
            </video>
          )}
        </div>
      </dialog>
    </>
  )
}
