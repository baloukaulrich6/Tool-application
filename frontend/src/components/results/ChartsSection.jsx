import TimePerBugChart from './charts/TimePerBugChart'
import UserProductivityChart from './charts/UserProductivityChart'
import ComplexityPieChart from './charts/ComplexityPieChart'
import AnomalyChart from './charts/AnomalyChart'

export default function ChartsSection({ results = {} }) {
  const timeData = results.time || {}
  const perfData = results.performance || {}
  const anomalyData = results.anomaly || {}

  return (
    <div className="charts-grid">
      <div className="chart-card">
        <div className="chart-title">Top 20 tickets — Temps de traitement (h)</div>
        <TimePerBugChart data={timeData.statistics?.time_per_bug || []} />
      </div>

      <div className="chart-card">
        <div className="chart-title">Top 10 utilisateurs — Score de productivité</div>
        <UserProductivityChart topPerformers={perfData.top_performers || []} />
      </div>

      <div className="chart-card">
        <div className="chart-title">Distribution de complexité des tickets</div>
        <ComplexityPieChart distribution={timeData.statistics?.complexity_distribution || {}} />
      </div>

      <div className="chart-card">
        <div className="chart-title">Anomalies détectées par type</div>
        <AnomalyChart summary={anomalyData.summary || {}} />
      </div>
    </div>
  )
}
