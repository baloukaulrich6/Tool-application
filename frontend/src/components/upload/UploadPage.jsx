import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FileDropZone from './FileDropZone'
import { uploadCSV } from '../../api/client'

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleUpload() {
    if (!file) return
    setIsLoading(true)
    setError(null)
    setProgress(0)

    try {
      const res = await uploadCSV(file, e => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 100))
      })
      navigate(`/results/${res.data.id}`)
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Erreur lors de l\'envoi du fichier. Vérifiez le format CSV.'
      setError(msg)
      setIsLoading(false)
    }
  }

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
          Analyse des délais de traitement Mantis
        </h1>
        <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
          Importez un export CSV de l'historique Mantis Bug Tracker pour analyser
          les délais de traitement, la performance des utilisateurs et détecter
          les anomalies.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <FileDropZone onFileSelected={setFile} isLoading={isLoading} />
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {isLoading && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            background: '#e5e7eb',
            borderRadius: '9999px',
            height: '8px',
            overflow: 'hidden',
          }}>
            <div style={{
              background: '#1a56db',
              height: '100%',
              width: `${progress}%`,
              transition: 'width 0.3s',
            }} />
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px', textAlign: 'center' }}>
            {progress < 100 ? `Upload : ${progress}%` : 'Analyse en cours...'}
          </p>
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleUpload}
        disabled={!file || isLoading}
        style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
      >
        {isLoading ? 'Analyse en cours...' : 'Lancer l\'analyse'}
      </button>

      {!isLoading && (
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginTop: '12px' }}>
          L'analyse peut prendre quelques secondes selon la taille du fichier.
        </p>
      )}
    </div>
  )
}
