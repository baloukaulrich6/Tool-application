import { Link } from 'react-router-dom'
import { useHistory } from '../../hooks/useHistory'
import HistoryTable from './HistoryTable'
import LoadingSpinner from '../shared/LoadingSpinner'

export default function HistoryPage() {
  const { runs, total, page, setPage, loading, error, refresh } = useHistory()

  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          Tool-application &mdash; <strong>Historique</strong>
        </div>
        <div className="topbar-spacer" />
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => refresh()}>
            Actualiser
          </button>
          <Link to="/" className="btn btn-primary">
            Nouvelle analyse
          </Link>
        </div>
      </div>

      <div className="page">
        <div className="page-header">
          <div className="page-title">
            <h1>Historique des analyses</h1>
            <p>{total} analyse{total > 1 ? 's' : ''} au total</p>
          </div>
          <div className="page-actions">
            <button className="btn btn-outline" onClick={() => refresh()}>
              Actualiser
            </button>
            <Link to="/" className="btn btn-primary">
              Nouvelle analyse
            </Link>
          </div>
        </div>

        {loading && <LoadingSpinner text="Chargement de l'historique..." />}

        {error && <div className="error-box">{error}</div>}

        {!loading && !error && (
          <>
            <div className="card">
              <HistoryTable runs={runs} onRefresh={refresh} />
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                <button
                  className="btn btn-outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Précédent
                </button>
                <span style={{ padding: '10px 16px', fontSize: '14px', color: 'var(--g500)' }}>
                  Page {page} / {totalPages}
                </span>
                <button
                  className="btn btn-outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
