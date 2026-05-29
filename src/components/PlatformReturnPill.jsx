import './PlatformReturnPill.css'

export default function PlatformReturnPill({ onSignOut }) {
  return (
    <div className="platform-return-pill">
      <button
        type="button"
        className="platform-return-button"
        onClick={() => {
          window.location.href = 'https://app.deepsitecontrol.com/launcher'
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
  )
}