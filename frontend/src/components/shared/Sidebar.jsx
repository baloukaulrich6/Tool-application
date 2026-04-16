import { useState } from 'react'
import { NavLink } from 'react-router-dom'

function ScbLogo() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="scb-bg" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5A623" />
          <stop offset="55%" stopColor="#E8681A" />
          <stop offset="100%" stopColor="#C94010" />
        </linearGradient>
      </defs>
      <rect width="42" height="42" rx="6" fill="url(#scb-bg)" />
      {/* Wave motif — Attijariwafa style */}
      <path
        d="M4 25 Q8 19 12 25 Q16 31 20 25 Q24 19 28 25 Q32 31 38 27"
        stroke="#1A1A1A" strokeWidth="2.2" fill="none" strokeLinecap="round"
      />
      <path
        d="M4 31 Q8 25 12 31 Q16 37 20 31 Q24 25 30 31"
        stroke="#1A1A1A" strokeWidth="2.2" fill="none" strokeLinecap="round"
      />
      {/* Small house / base */}
      <rect x="4" y="34" width="8" height="5" rx="1" fill="#1A1A1A" />
    </svg>
  )
}

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

function IconMantis() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
    </svg>
  )
}

function IconAnalyse() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function IconHistory() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconChevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export default function Sidebar() {
  const [mantisOpen, setMantisOpen] = useState(true)

  return (
    <nav className="sidebar">
      {/* ── Logo SCB ── */}
      <div className="sidebar-logo">
        <ScbLogo />
        <div>
          <div className="sidebar-logo-name">SCB Cameroun</div>
          <div className="sidebar-logo-sub">
            Groupe Attijariwafa <span>bank</span>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="sidebar-nav">

        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <IconDashboard />
          Dashboard
        </NavLink>

        {/* Mantis (expandable) */}
        <button
          className="sidebar-group"
          onClick={() => setMantisOpen(o => !o)}
          aria-expanded={mantisOpen}
        >
          <IconMantis />
          <span>Mantis</span>
          <span className={`sidebar-group-chevron${mantisOpen ? ' open' : ''}`}>
            <IconChevron />
          </span>
        </button>

        {mantisOpen && (
          <div className="sidebar-submenu">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <IconAnalyse />
              Analyser
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <IconHistory />
              Historique
            </NavLink>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <div style={{ fontWeight: 600, color: 'var(--g600)', marginBottom: '2px' }}>
          Tool-application
        </div>
        <div>SCB — Outil interne</div>
      </div>
    </nav>
  )
}
