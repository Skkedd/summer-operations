import { useEffect, useState } from 'react'
import './PlatformReturnPill.css'

export default function PlatformReturnPill({ onSignOut }) {
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    const collapseTimer = setTimeout(() => {
      setIsOpen(false)
    }, 1600)

    return () => clearTimeout(collapseTimer)
  }, [])

  function openPill() {
    setIsOpen(true)
  }

  function closePill() {
    setIsOpen(false)
  }

  return (
    <div
      className={`platform-return-pill ${isOpen ? 'open' : 'collapsed'}`}
      onMouseEnter={openPill}
      onMouseLeave={closePill}
      onFocus={openPill}
    >
      <button
        type="button"
        className="platform-return-handle"
        aria-label="Open platform controls"
        onClick={openPill}
      >
        ◀
      </button>

      <div className="platform-return-actions">
        <button
          type="button"
          className="platform-return-button"
          onClick={() => {
            window.location.href =
              'https://app.deepsitecontrol.com/launcher'
          }}
        >
          Launcher
        </button>

        <button
          type="button"
          className="platform-return-button signout"
          onClick={onSignOut}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}