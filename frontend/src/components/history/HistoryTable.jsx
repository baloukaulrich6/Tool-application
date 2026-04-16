import { useNavigate } from 'react-router-dom'

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

export default function HistoryTable({ runs = [], onRefresh }) {
  const navigate = useNavigate()

  if (runs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📂</div>
        <div className="empty-title">Aucune analyse dans l'historique</div>
        <div className="empty-sub">Importez un fichier CSV pour commencer.</div>
      </div>
    )
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Fichier</th>
            <th>Date</th>
            <th>Statut</th>
            <th>Lignes</th>
            <th>Durée analyse</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {runs.map(run => {
            const badgeClass = STATUS_BADGE[run.status] || 'badge-pending'
            const label = STATUS_LABEL[run.status] || run.status
            return (
              <tr
                key={run.id}
                style={{ cursor: run.status === 'completed' ? 'pointer' : 'default' }}
                onClick={() => run.status === 'completed' && navigate(`/results/${run.id}`)}
              >
                <td style={{ fontWeight: 500 }}>{run.filename}</td>
                <td style={{ color: 'var(--g500)' }}>{fmtDate(run.uploaded_at)}</td>
                <td>
                  <div className="status-pill">
                    <span className={`badge ${badgeClass}`}>
                      <span className="badge-dot" />
                      {label}
                    </span>
                  </div>
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
                      style={{ padding: '5px 12px', fontSize: '12px' }}
                      onClick={e => { e.stopPropagation(); navigate(`/results/${run.id}`) }}
                    >
                      Voir
                    </button>
                  )}
                  {run.status === 'failed' && run.error_message && (
                    <span style={{ fontSize: '12px', color: 'var(--red)' }} title={run.error_message}>
                      Erreur
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
