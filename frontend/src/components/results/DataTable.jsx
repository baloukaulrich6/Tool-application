import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table'

function fmtSeconds(s) {
  if (!s) return '0 h'
  return `${(s / 3600).toFixed(1)} h`
}

const TIME_COLUMNS = [
  { accessorKey: 'bug_id', header: 'Ticket', size: 80 },
  { accessorKey: 'user_id', header: 'Utilisateur', size: 90 },
  { accessorKey: 'nombre_interventions', header: 'Interventions', size: 100 },
  {
    accessorKey: 'temps_total_secondes',
    header: 'Temps total',
    cell: ({ getValue }) => fmtSeconds(getValue()),
    size: 110,
  },
  { accessorKey: 'temps_total_formate', header: 'Détail durée', size: 200 },
  { accessorKey: 'complexite_estimee', header: 'Complexité', size: 110 },
  { accessorKey: 'premiere_intervention', header: 'Première intervention', size: 160 },
  { accessorKey: 'derniere_intervention', header: 'Dernière intervention', size: 160 },
  {
    accessorKey: 'est_handler',
    header: 'Handler',
    cell: ({ getValue }) => (getValue() ? 'Oui' : ''),
    size: 70,
  },
]

const PERF_COLUMNS = [
  { accessorKey: 'user_id', header: 'Utilisateur', size: 90 },
  { accessorKey: 'rank', header: 'Rang', size: 60 },
  { accessorKey: 'productivity_score', header: 'Score', size: 90 },
  { accessorKey: 'total_actions', header: 'Actions totales', size: 110 },
  { accessorKey: 'unique_bugs', header: 'Tickets uniques', size: 110 },
  { accessorKey: 'avg_actions_per_bug', header: 'Actions/ticket', size: 110 },
  { accessorKey: 'active_days', header: 'Jours actifs', size: 100 },
]

const ANOMALY_COLUMNS = [
  { accessorKey: 'type', header: 'Type', size: 160, cell: ({ getValue }) => TYPE_LABELS[getValue()] || getValue() },
  { accessorKey: 'severity', header: 'Sévérité', size: 90 },
  { accessorKey: 'description', header: 'Description', size: 360 },
  { accessorKey: 'bug_id', header: 'Ticket', size: 80 },
  { accessorKey: 'user_id', header: 'Utilisateur', size: 90 },
]

const TYPE_LABELS = {
  rapid_actions: 'Actions rapides',
  excessive_duration: 'Durée excessive',
  unusual_activity: 'Activité inhabituelle',
}

function buildAnomalyRows(anomalyResult = {}) {
  return [
    ...(anomalyResult.rapid_actions || []).map(a => ({ ...a, type: 'rapid_actions' })),
    ...(anomalyResult.excessive_durations || []).map(a => ({ ...a, type: 'excessive_duration' })),
    ...(anomalyResult.unusual_activity || []).map(a => ({ ...a, type: 'unusual_activity' })),
  ]
}

function Table({ data, columns, globalFilter, setGlobalFilter }) {
  const [sorting, setSorting] = useState([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(h => (
                <th
                  key={h.id}
                  onClick={h.column.getToggleSortingHandler()}
                  style={{ width: h.column.columnDef.size }}
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                  {h.column.getIsSorted() === 'asc' ? ' ↑' : h.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.slice(0, 200).map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.getRowModel().rows.length > 200 && (
        <p style={{ padding: '10px 16px', fontSize: '12px', color: '#9ca3af' }}>
          Affichage limité à 200 lignes (total : {table.getRowModel().rows.length})
        </p>
      )}
    </div>
  )
}

export default function DataTable({ results = {} }) {
  const [activeTab, setActiveTab] = useState('time')
  const [globalFilter, setGlobalFilter] = useState('')

  const tabs = [
    { key: 'time', label: 'Temps par ticket/utilisateur' },
    { key: 'performance', label: 'Performance utilisateurs' },
    { key: 'anomaly', label: 'Anomalies' },
  ]

  const { data, columns } = useMemo(() => {
    if (activeTab === 'time') {
      return {
        data: results.time?.details || [],
        columns: TIME_COLUMNS,
      }
    }
    if (activeTab === 'performance') {
      return {
        data: Object.values(results.performance?.user_performance || {}),
        columns: PERF_COLUMNS,
      }
    }
    return {
      data: buildAnomalyRows(results.anomaly),
      columns: ANOMALY_COLUMNS,
    }
  }, [activeTab, results])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {tabs.map(t => (
            <button
              key={t.key}
              className={`tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => { setActiveTab(t.key); setGlobalFilter('') }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          className="filter-input"
          placeholder="Filtrer..."
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
        />
      </div>
      <Table
        data={data}
        columns={columns}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
    </div>
  )
}
