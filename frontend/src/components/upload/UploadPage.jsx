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
        "Erreur lors de l'envoi du fichier. Vérifiez le format CSV."
      setError(msg)
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">Nouvelle analyse</h1>
        </div>
      </div>

      <div className="page" style={{ maxWidth: 720 }}>
        <div className="page-header" style={{ marginBottom: '24px' }}>
          <div className="page-title">
            <h1>Analyse des délais de traitement Mantis</h1>
            <p>
              Importez un export CSV de l'historique Mantis Bug Tracker pour analyser
              les délais de traitement, la performance des utilisateurs et détecter
              les anomalies.
            </p>
          </div>
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
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <p style={{ fontSize: '13px', color: 'var(--g500)', marginTop: '6px', textAlign: 'center' }}>
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
          {isLoading ? 'Analyse en cours...' : "Lancer l'analyse"}
        </button>

        {!isLoading && (
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--g400)', marginTop: '12px' }}>
            L'analyse peut prendre quelques secondes selon la taille du fichier.
          </p>
        )}
      </div>
    </>
  )
}
