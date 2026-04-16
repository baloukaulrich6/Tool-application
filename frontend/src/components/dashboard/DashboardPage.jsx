import { Link, useNavigate } from 'react-router-dom'
import { useHistory } from '../../hooks/useHistory'
import LoadingSpinner from '../shared/LoadingSpinner'

const STATUS_BADGE = {
  completed: 'badge-completed',
  failed:    'badge-failed',
  running:   'badge-running',
  pending:   'badge-pending',
}
const STATUS_LABEL = {
  completed: 'Terminé',
  failed:    'Échec',
  running:   'En cours',
  pending:   'En attente',
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function DashboardPage() {
  const { runs, total, loading, error } = useHistory()
  const navigate = useNavigate()

  const completed = runs.filter(r => r.status === 'completed').length
  const failed    = runs.filter(r => r.status === 'failed').length
  const inProg    = runs.filter(r => r.status === 'running' || r.status === 'pending').length

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          Tool-application &mdash; <strong>Dashboard</strong>
        </div>
        <div className="topbar-spacer" />
        <div className="page-actions">
          <Link to="/" className="btn btn-primary">Nouvelle analyse</Link>
        </div>
      </div>

      <div className="page">
        <div className="page-header">
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Dashboard</h1>
            <p style={{ color: 'var(--g500)', fontSize: '13px' }}>
              Vue d'ensemble des fichiers chargés et traités
            </p>
          </div>
          <div className="page-actions">
            <Link to="/" className="btn btn-primary">Nouvelle analyse</Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid" style={{ marginBottom: '28px' }}>
          <div className="kpi-card">
            <div className="kpi-label">Total fichiers</div>
            <div className="kpi-value">{loading ? '—' : total}</div>
            <div className="kpi-sub">analyses enregistrées</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Terminées</div>
            <div className="kpi-value" style={{ color: 'var(--green)' }}>
              {loading ? '—' : completed}
            </div>
            <div className="kpi-sub">sur la page courante</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Échouées</div>
            <div className="kpi-value" style={{ color: 'var(--red)' }}>
              {loading ? '—' : failed}
            </div>
            <div className="kpi-sub">vérifier les erreurs</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">En cours</div>
            <div className="kpi-value" style={{ color: 'var(--amber)' }}>
              {loading ? '—' : inProg}
            </div>
            <div className="kpi-sub">en attente ou actives</div>
          </div>
        </div>

        {/* Recent Files Table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Fichiers récents</div>
            <Link
              to="/history"
              style={{ fontSize: '12px', color: 'var(--orange)', fontWeight: 500 }}
            >
              Voir tout →
            </Link>
          </div>

          {loading && <LoadingSpinner text="Chargement..." />}
          {error   && <div className="error-box">{error}</div>}

          {!loading && !error && (
            runs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <div className="empty-title">Aucun fichier traité</div>
                <div className="empty-sub">
                  Importez un export CSV Mantis Bug Tracker pour commencer.
                </div>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Fichier</th>
                      <th>Date</th>
                      <th>Statut</th>
                      <th>Lignes</th>
                      <th>Durée</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.slice(0, 10).map(run => {
                      const badgeClass = STATUS_BADGE[run.status] || 'badge-pending'
                      const label      = STATUS_LABEL[run.status] || run.status
                      return (
                        <tr
                          key={run.id}
                          style={{ cursor: run.status === 'completed' ? 'pointer' : 'default' }}
                          onClick={() => run.status === 'completed' && navigate(`/results/${run.id}`)}
                        >
                          <td style={{ fontWeight: 500 }}>{run.filename}</td>
                          <td style={{ color: 'var(--g500)' }}>{fmtDate(run.uploaded_at)}</td>
                          <td>
                            <span className={`badge ${badgeClass}`}>
                              <span className="badge-dot" />
                              {label}
                            </span>
                          </td>
                          <td style={{ color: 'var(--g500)' }}>
                            {run.row_count != null ? run.row_count.toLocaleString('fr-FR') : '—'}
                          </td>
                          <td style={{ color: 'var(--g500)' }}>
                            {run.duration_seconds != null ? `${run.duration_seconds}s` : '—'}
                          </td>
                          <td>
                            {run.status === 'completed' && (
                              <button
                                className="btn btn-outline"
                                style={{ padding: '4px 10px', fontSize: '12px' }}
                                onClick={e => { e.stopPropagation(); navigate(`/results/${run.id}`) }}
                              >
                                Voir
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </>
  )
}
