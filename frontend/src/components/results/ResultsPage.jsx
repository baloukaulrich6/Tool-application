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

  if (loading) return <div className="page"><LoadingSpinner text="Chargement des résultats..." /></div>

  if (error) {
    return (
      <div className="page">
        <div className="error-box">{error}</div>
        <Link to="/" className="btn btn-outline" style={{ marginTop: 16, display: 'inline-flex' }}>
          Retour
        </Link>
      </div>
    )
  }

  if (!run) return null

  const stats = run.results?.time?.statistics

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
            {run.filename}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Analyse terminée &mdash; {run.row_count ?? 0} lignes traitées
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
            <span style={{ marginLeft: '10px', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>
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
  )
}
