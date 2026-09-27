import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { FleetEntryGate } from './foundation/react.jsx'
import { supabase } from './lib/supabaseClient.js'
import { summerManifest } from './fleetManifest.js'
import './styles/summer-operations.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FleetEntryGate client={supabase} assignmentMode={import.meta.env.VITE_BACKEND_AUTH_V2 === 'true' ? 'explicit' : 'compatibility'} moduleKey={summerManifest.key}><App /></FleetEntryGate>
  </React.StrictMode>,
)
