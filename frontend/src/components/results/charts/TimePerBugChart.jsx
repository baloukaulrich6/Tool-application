import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

export default function TimePerBugChart({ data = [] }) {
  const top20 = [...data]
    .sort((a, b) => b.total_seconds - a.total_seconds)
    .slice(0, 20)
    .map(d => ({ ...d, heures: d.total_hours }))

  if (top20.length === 0) {
    return <p style={{ color: '#9ca3af', textAlign: 'center', padding: '24px' }}>Pas de données</p>
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, top20.length * 26)}>
      <BarChart data={top20} layout="vertical" margin={{ left: 16, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" unit="h" tick={{ fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="bug_id"
          width={70}
          tick={{ fontSize: 11 }}
          tickFormatter={v => `#${v}`}
        />
        <Tooltip
          formatter={(v) => [`${v} h`, 'Temps']}
          labelFormatter={l => `Ticket #${l}`}
        />
        <Bar dataKey="heures" fill="#1a56db" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
