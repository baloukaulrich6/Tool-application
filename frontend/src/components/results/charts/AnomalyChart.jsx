import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const COLORS = {
  high: '#e02424',
  medium: '#d97706',
  low: '#3b82f6',
}

export default function AnomalyChart({ summary = {} }) {
  const byType = summary.by_type || {}
  const data = Object.entries(byType).map(([type, count]) => ({
    type: TYPE_LABELS[type] || type,
    count,
  }))

  if (data.length === 0) {
    return (
      <p style={{ color: '#0e9f6e', textAlign: 'center', padding: '24px', fontWeight: 600 }}>
        Aucune anomalie détectée
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="type" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip formatter={(v) => [v, 'Anomalies']} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={['#e02424', '#d97706', '#3b82f6'][i % 3]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

const TYPE_LABELS = {
  rapid_actions: 'Actions rapides',
  excessive_duration: 'Durée excessive',
  unusual_activity: 'Activité inhabit.',
}
