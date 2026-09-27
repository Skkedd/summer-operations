
import '../styles/summer-operations.css'

export default function SummerOperationsHomePage() {
  return (
    <main className="summer-operations-page">


      <div className="summer-operations-hero">
        <div className="summer-operations-eyebrow">
          SUMMER OPERATIONS
        </div>

        <h1 className="summer-operations-title">
          Staffing simulation and operational planning
        </h1>

        <p className="summer-operations-subtitle">
          Preview a possible summer custodial planning experience. The figures
          below are sample data; schedules and scenarios are not yet saved here.
        </p>

        <div className="summer-operations-actions">
          <span>Planning dashboard and scenario creation are in development.</span>
        </div>
      </div>

      <section className="summer-dashboard-grid">
        <div className="summer-card large-card">
          <div className="card-label">
            SAMPLE SUMMER RUN
          </div>

          <div className="card-title">
            District Summer Schedule
          </div>

          <div className="summer-metrics-row">
            <div className="metric-block">
              <div className="metric-value">36</div>
              <div className="metric-label">Target Days</div>
            </div>

            <div className="metric-block">
              <div className="metric-value">4</div>
              <div className="metric-label">Cleaning Staff</div>
            </div>

            <div className="metric-block">
              <div className="metric-value">1</div>
              <div className="metric-label">Carpet Staff</div>
            </div>
          </div>
        </div>

        <div className="summer-card">
          <div className="card-label">SAMPLE PROJECTION</div>
          <div className="big-status">ON TRACK</div>
          <div className="small-text">
            Estimated completion before target deadline.
          </div>
        </div>

        <div className="summer-card">
          <div className="card-label">SAMPLE STAFFING ALERTS</div>
          <div className="big-number">2</div>
          <div className="small-text">
            Idle crew gaps and room access conflicts detected.
          </div>
        </div>

        <div className="summer-card">
          <div className="card-label">SAMPLE SITES</div>
          <div className="big-number">3</div>
          <div className="small-text">
            Wright, RL Stevens and JX Wilson.
          </div>
        </div>

        <div className="summer-card wide-card">
          <div className="card-label">NEXT PHASE</div>

          <div className="timeline-preview">
            Summer Operations is currently transitioning from the
            trusted Python scheduling engine into the Deep Site
            web ecosystem with scenario management, staffing
            simulation and operational reporting.
          </div>
        </div>
      </section>
    </main>
  )
}
