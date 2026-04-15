import { useState, useEffect, useCallback } from 'react'
import { listAnalyses } from '../api/client'

export function useHistory() {
  const [runs, setRuns] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback((p = page) => {
    setLoading(true)
    setError(null)
    listAnalyses(p)
      .then(res => {
        setRuns(res.data.results)
        setTotal(res.data.count)
        setLoading(false)
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'Erreur lors du chargement de l\'historique.')
        setLoading(false)
      })
  }, [page])

  useEffect(() => { fetch() }, [fetch])

  return { runs, total, page, setPage, loading, error, refresh: fetch }
}
