import { useState, useEffect } from 'react'
import { getAnalysis } from '../api/client'

export function useAnalysis(runId) {
  const [run, setRun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!runId) return
    setLoading(true)
    setError(null)

    getAnalysis(runId)
      .then(res => {
        setRun(res.data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'Erreur lors du chargement de l\'analyse.')
        setLoading(false)
      })
  }, [runId])

  return { run, loading, error }
}
