import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

export default function UserProductivityChart({ topPerformers = [] }) {
  const data = topPerformers.slice(0, 10).map(p => ({
    user: `U${p.user_id}`,
    score: p.productivity_score,
    bugs: p.unique_bugs,
  }))

  if (data.length === 0) {
    return <p style={{ color: '#9ca3af', textAlign: 'center', padding: '24px' }}>Pas de données</p>
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ left: 8, right: 16, top: 4, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="user" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(v, name) => [v, name === 'score' ? 'Score' : 'Tickets']}
          labelFormatter={l => `Utilisateur ${l}`}
        />
        <Bar dataKey="score" fill="#0e9f6e" radius={[4, 4, 0, 0]} name="score" />
      </BarChart>
    </ResponsiveContainer>
  )
}
