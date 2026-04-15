const LABELS = {
  info: 'Info',
  warning: 'Attention',
  critical: 'Critique',
}

const CAT_LABELS = {
  time: 'Temps',
  performance: 'Performance',
  anomaly: 'Anomalie',
}

export default function InsightsPanel({ insights = [] }) {
  if (insights.length === 0) {
    return (
      <div style={{ color: '#6b7280', fontStyle: 'italic', padding: '16px 0' }}>
        Aucun insight généré.
      </div>
    )
  }

  const sorted = [...insights].sort(order => {
    if (order.severity === 'critical') return -1
    if (order.severity === 'warning') return 0
    return 1
  })

  return (
    <div className="insight-list">
      {sorted.map((ins, i) => (
        <div key={i} className={`insight-item ${ins.severity}`}>
          <span className={`badge badge-${ins.severity === 'critical' ? 'critical' : ins.severity === 'warning' ? 'warning' : 'info'}`}>
            {LABELS[ins.severity] || ins.severity}
          </span>
          <div>
            <div className="insight-message">{ins.message}</div>
            <div className="insight-meta">
              {CAT_LABELS[ins.category] || ins.category}
              {ins.affected_id && ` — Concerné : ${ins.affected_id}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
