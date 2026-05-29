import {
  ArrowUpRight,
  ClipboardList,
  Clock3,
  Layers3,
  Wrench,
  CheckCircle2,
  Inbox,
  CalendarClock,
} from 'lucide-react'
import PlatformReturnPill from './components/PlatformReturnPill'
import './App.css'
import { useEffect } from "react";
import { supabase } from "./lib/supabaseClient";

const queueItems = [
  {
    title: 'HVAC request - Room 14',
    status: 'New',
    site: 'Wright',
  },
  {
    title: 'Chromebook cart network issue',
    status: 'Assigned',
    site: 'JX Wilson',
  },
  {
    title: 'Community kitchen permit review',
    status: 'Pending',
    site: 'District Office',
  },
]

const stats = [
  {
    label: 'Open Requests',
    value: '18',
    icon: ClipboardList,
  },
  {
    label: 'Assigned Today',
    value: '7',
    icon: Wrench,
  },
  {
    label: 'Pending Review',
    value: '4',
    icon: Clock3,
  },
  {
    label: 'Departments',
    value: '5',
    icon: Layers3,
  },
]

const meetingSummary = [
  {
    label: 'New Since Last Review',
    value: '6',
    icon: Inbox,
  },
  {
    label: 'Completed Since Last Review',
    value: '9',
    icon: CheckCircle2,
  },
  {
    label: 'Currently Open',
    value: '18',
    icon: ClipboardList,
  },
  {
    label: 'Last Reviewed',
    value: 'May 20',
    icon: CalendarClock,
  },
]

export default function App() {

  useEffect(() => {
    console.warn(
      "Platform auth gate temporarily disabled while shared session handoff is unfinished."
    );
  }, []);

  function handleSignOut() {
    window.location.href = 'https://app.deepsitecontrol.com/logout'
  }

  return (
    <main className="app-shell">
      <div className="background-glow" />

      <PlatformReturnPill onSignOut={handleSignOut} />

      <header className="topbar">
        <div>
          <p className="eyebrow">Operations Requests</p>
          <h1>Operational workflow and request management</h1>
        </div>
      </header>

      <section className="hero-card">
        <div className="hero-copy">
          <p className="hero-tag">Industrial Operations Module</p>

          <h2>
            Work orders, IT tickets, facility use requests and operational workflows.
          </h2>

          <p>
            Built for real district operations with shared platform identity across
            Deep Site modules.
          </p>

          <div className="hero-actions">
            <button className="primary-button">
              Open Request Queue
            </button>

            <button className="secondary-button">
              Create Request
            </button>
          </div>
        </div>

        <div className="hero-status-panel">
          <div className="status-pill">
            <span className="status-dot" />
            Live Operational Queue
          </div>

          <div className="status-grid">
            {stats.map((stat) => {
              const Icon = stat.icon

              return (
                <article className="stat-card" key={stat.label}>
                  <div className="stat-icon">
                    <Icon size={18} />
                  </div>

                  <strong>{stat.value}</strong>

                  <span>{stat.label}</span>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="meeting-summary-panel">
        <div className="panel-header">
          <div>
            <p className="panel-label">Meeting Summary</p>
            <h3>Maintenance Review Snapshot</h3>
          </div>

          <button className="panel-action">
            Copy Summary
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="meeting-summary-grid">
          {meetingSummary.map((item) => {
            const Icon = item.icon

            return (
              <article className="meeting-summary-card" key={item.label}>
                <div className="stat-icon">
                  <Icon size={18} />
                </div>

                <strong>{item.value}</strong>

                <span>{item.label}</span>
              </article>
            )
          })}
        </div>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-label">Live Queue</p>
              <h3>Recent Requests</h3>
            </div>

            <button className="panel-action">
              View All
              <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="queue-list">
            {queueItems.map((item) => (
              <div className="queue-item" key={item.title}>
                <div>
                  <strong>{item.title}</strong>

                  <span>
                    {item.site} • {item.status}
                  </span>
                </div>

                <button className="queue-button">
                  Open
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="panel side-panel">
          <div className="panel-header">
            <div>
              <p className="panel-label">Module Status</p>
              <h3>Development Foundation</h3>
            </div>
          </div>

          <div className="module-checklist">
            <div className="check-item">
              <span className="check-dot complete" />
              Platform shell established
            </div>

            <div className="check-item">
              <span className="check-dot complete" />
              Industrial blue identity
            </div>

            <div className="check-item">
              <span className="check-dot active" />
              Request system in development
            </div>

            <div className="check-item">
              <span className="check-dot" />
              Shared auth integration pending
            </div>
          </div>
        </article>
      </section>
    </main>
  )
}