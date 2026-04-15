import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 120000, // 2 min pour les gros fichiers
})

export function uploadCSV(file, onUploadProgress) {
  const formData = new FormData()
  formData.append('csv_file', file)
  return api.post('/api/v1/analyses/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })
}

export function getAnalysis(id) {
  return api.get(`/api/v1/analyses/${id}/`)
}

export function listAnalyses(page = 1) {
  return api.get('/api/v1/analyses/', { params: { page } })
}

export function getExportUrl(id) {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  return `${base}/api/v1/analyses/${id}/export/`
}
