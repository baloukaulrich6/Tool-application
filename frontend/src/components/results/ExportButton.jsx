import { getExportUrl } from '../../api/client'

export default function ExportButton({ runId, filename }) {
  function handleExport() {
    const url = getExportUrl(runId)
    const a = document.createElement('a')
    a.href = url
    a.download = filename ? `analyse_${filename}` : `analyse_${runId.slice(0, 8)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <button className="btn btn-success" onClick={handleExport}>
      Exporter CSV
    </button>
  )
}
