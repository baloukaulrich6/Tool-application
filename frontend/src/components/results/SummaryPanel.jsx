function fmtSeconds(s) {
  if (!s) return '—'
  const h = s / 3600
  if (h > 24) return `${(h / 24).toFixed(1)} jours`
  return `${h.toFixed(1)} h`
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function SummaryPanel({ run, stats }) {
  const kpis = [
    {
      label: 'Tickets analysés',
      value: stats?.total_bugs ?? '—',
      sub: `${run.row_count ?? 0} lignes dans le CSV`,
    },
    {
      label: 'Utilisateurs',
      value: stats?.total_users ?? '—',
      sub: `${stats?.handler_stats?.total_handlers ?? 0} handlers`,
    },
    {
      label: 'Temps moyen / ticket',
      value: fmtSeconds(stats?.avg_time_per_bug_seconds),
      sub: `Médiane : ${fmtSeconds(stats?.median_time_per_bug_seconds)}`,
    },
    {
      label: 'Date d\'analyse',
      value: run.duration_seconds ? `${run.duration_seconds}s` : '—',
      sub: fmtDate(run.uploaded_at),
    },
  ]

  return (
    <div className="kpi-grid">
      {kpis.map(k => (
        <div key={k.label} className="kpi-card">
          <div className="kpi-label">{k.label}</div>
          <div className="kpi-value">{k.value}</div>
          <div className="kpi-sub">{k.sub}</div>
        </div>
      ))}
    </div>
  )
}
