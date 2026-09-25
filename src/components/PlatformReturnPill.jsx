import { useEffect, useState } from 'react'
import { PLATFORM_HOME } from '../foundation/navigation'
import { signOutAndReturn } from '../foundation/session'
import { supabase } from '../lib/supabaseClient'
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
            window.location.href = PLATFORM_HOME
          }}
        >
          Launcher
        </button>

        <button
          type="button"
          className="platform-return-button signout"
          onClick={() => void (onSignOut ? onSignOut() : signOutAndReturn(supabase))}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
