import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">M</span>
        <div className="logo-text">
          <span style={{ display: 'block', fontWeight: 700, fontSize: '15px' }}>Mantis</span>
          <span style={{ display: 'block', fontWeight: 400, fontSize: '11px', opacity: 0.6 }}>Analyzer</span>
        </div>
      </div>

      <div className="sidebar-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Analyser
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Historique
        </NavLink>
      </div>

      <div className="sidebar-footer">SCB — Outil interne</div>
    </nav>
  )
}
