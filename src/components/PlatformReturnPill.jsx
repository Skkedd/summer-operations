import { useEffect, useState } from 'react'
import './PlatformReturnPill.css'

export default function PlatformReturnPill({ onSignOut }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setCollapsed(true)
    }, 1600)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`platform-return-pill ${collapsed ? 'collapsed' : ''}`}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
    >
      <button
        type="button"
        className="platform-return-button launcher"
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

      <div className="platform-pill-arrow">
        →
      </div>
    </div>
  )
}