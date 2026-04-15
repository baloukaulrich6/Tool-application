import { NavLink } from 'react-router-dom'

export default function NavBar() {
  return (
    <nav style={{
      background: '#1a56db',
      color: '#fff',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '32px',
      height: '56px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
    }}>
      <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '0.02em' }}>
        Mantis Analyzer
      </span>
      <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
        <NavLink to="/" end style={navStyle}>
          Analyser
        </NavLink>
        <NavLink to="/history" style={navStyle}>
          Historique
        </NavLink>
      </div>
      <span style={{ fontSize: '12px', opacity: 0.7 }}>SCB — Outil interne</span>
    </nav>
  )
}

function navStyle({ isActive }) {
  return {
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
    transition: 'background 0.15s',
  }
}
