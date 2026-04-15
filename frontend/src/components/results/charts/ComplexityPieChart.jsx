import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const COLORS = {
  'Simple': '#0e9f6e',
  'Moyen': '#3b82f6',
  'Complexe': '#d97706',
  'Très complexe': '#e02424',
}

export default function ComplexityPieChart({ distribution = {} }) {
  const data = Object.entries(distribution).map(([name, value]) => ({ name, value }))

  if (data.length === 0) {
    return <p style={{ color: '#9ca3af', textAlign: 'center', padding: '24px' }}>Pas de données</p>
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={3}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map(entry => (
            <Cell key={entry.name} fill={COLORS[entry.name] || '#8b5cf6'} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [v, 'Tickets']} />
      </PieChart>
    </ResponsiveContainer>
  )
}
