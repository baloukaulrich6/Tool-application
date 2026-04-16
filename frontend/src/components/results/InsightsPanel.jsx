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
      <div className="empty-state">
        <div className="empty-icon">✓</div>
        <div className="empty-title">Aucun insight généré</div>
        <div className="empty-sub">L'analyse n'a détecté aucune anomalie ou recommandation.</div>
      </div>
    )
  }

  const sorted = [...insights].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 }
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
  })

  return (
    <div className="insight-list">
      {sorted.map((ins, i) => {
        const badgeClass = ins.severity === 'critical' ? 'badge-critical'
          : ins.severity === 'warning' ? 'badge-warning'
          : 'badge-info'
        return (
          <div key={i} className={`insight-item ${ins.severity}`}>
            <span className={`badge ${badgeClass}`}>
              <span className="badge-dot" />
              {LABELS[ins.severity] || ins.severity}
            </span>
            <div style={{ flex: 1 }}>
              <div className="insight-message">{ins.message}</div>
              <div className="insight-meta">
                {CAT_LABELS[ins.category] || ins.category}
                {ins.affected_id && ` — Concerné : ${ins.affected_id}`}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
