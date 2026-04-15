import { useNavigate } from 'react-router-dom'

const STATUS_STYLES = {
  completed: { color: '#0e9f6e', label: 'Terminé' },
  failed:    { color: '#e02424', label: 'Échec' },
  running:   { color: '#d97706', label: 'En cours' },
  pending:   { color: '#6b7280', label: 'En attente' },
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
      <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
        <p style={{ fontSize: '48px', marginBottom: '12px' }}>📂</p>
        <p>Aucune analyse dans l'historique.</p>
        <p style={{ fontSize: '13px', marginTop: '4px' }}>
          Importez un fichier CSV pour commencer.
        </p>
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
            const s = STATUS_STYLES[run.status] || STATUS_STYLES.pending
            return (
              <tr
                key={run.id}
                style={{ cursor: run.status === 'completed' ? 'pointer' : 'default' }}
                onClick={() => run.status === 'completed' && navigate(`/results/${run.id}`)}
              >
                <td style={{ fontWeight: 500 }}>{run.filename}</td>
                <td style={{ color: '#6b7280' }}>{fmtDate(run.uploaded_at)}</td>
                <td>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: `${s.color}22`,
                    color: s.color,
                  }}>
                    {s.label}
                  </span>
                </td>
                <td style={{ color: '#6b7280' }}>
                  {run.row_count != null ? run.row_count.toLocaleString('fr-FR') : '—'}
                </td>
                <td style={{ color: '#6b7280' }}>
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
                    <span style={{ fontSize: '12px', color: '#e02424' }} title={run.error_message}>
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
