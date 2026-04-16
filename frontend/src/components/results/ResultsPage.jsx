import { useParams, Link } from 'react-router-dom'
import { useAnalysis } from '../../hooks/useAnalysis'
import LoadingSpinner from '../shared/LoadingSpinner'
import SummaryPanel from './SummaryPanel'
import InsightsPanel from './InsightsPanel'
import ChartsSection from './ChartsSection'
import DataTable from './DataTable'
import ExportButton from './ExportButton'

export default function ResultsPage() {
  const { id } = useParams()
  const { run, loading, error } = useAnalysis(id)

  if (loading) {
    return (
      <>
        <div className="topbar">
          <div className="topbar-title">Résultats</div>
        </div>
        <div className="page"><LoadingSpinner text="Chargement des résultats..." /></div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <div className="topbar">
          <div className="topbar-title">Erreur</div>
        </div>
        <div className="page">
          <div className="error-box">{error}</div>
          <Link to="/" className="btn btn-outline" style={{ marginTop: 16, display: 'inline-flex' }}>
            Retour
          </Link>
        </div>
      </>
    )
  }

  if (!run) return null

  const stats = run.results?.time?.statistics

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">{run.filename}</div>
        </div>
        <div className="page-actions">
          <Link to="/" className="btn btn-outline">Nouvelle analyse</Link>
          <ExportButton runId={run.id} filename={run.filename} />
        </div>
      </div>

      <div className="page">
        {/* Page header */}
        <div className="page-header">
          <div className="page-title">
            <h1>{run.filename}</h1>
            <p>Analyse terminée &mdash; {run.row_count ?? 0} lignes traitées</p>
          </div>
          <div className="page-actions">
            <Link to="/" className="btn btn-outline">Nouvelle analyse</Link>
            <ExportButton runId={run.id} filename={run.filename} />
          </div>
        </div>

        {/* KPIs */}
        <SummaryPanel run={run} stats={stats} />

        {/* Insights */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="section-title">
            Insights et recommandations
            {run.insights?.length > 0 && (
              <span style={{ marginLeft: '10px', fontSize: '13px', fontWeight: 500, color: 'var(--g500)' }}>
                ({run.insights.length})
              </span>
            )}
          </div>
          <InsightsPanel insights={run.insights || []} />
        </div>

        {/* Charts */}
        <div style={{ marginBottom: '8px' }}>
          <div className="section-title" style={{ marginBottom: '16px' }}>Visualisations</div>
          <ChartsSection results={run.results || {}} />
        </div>

        {/* Data table */}
        <div className="card">
          <div className="section-title">Données détaillées</div>
          <DataTable results={run.results || {}} />
        </div>
      </div>
    </>
  )
}
