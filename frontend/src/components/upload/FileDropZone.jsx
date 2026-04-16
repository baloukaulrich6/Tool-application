import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

export default function FileDropZone({ onFileSelected, isLoading }) {
  const onDrop = useCallback(
    acceptedFiles => {
      if (acceptedFiles.length > 0) onFileSelected(acceptedFiles[0])
    },
    [onFileSelected]
  )

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
    disabled: isLoading,
  })

  const file = acceptedFiles[0]

  return (
    <div
      {...getRootProps()}
      style={{
        border: `2px dashed ${isDragActive ? 'var(--orange)' : 'var(--g300)'}`,
        borderRadius: '12px',
        padding: '48px 32px',
        textAlign: 'center',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        background: isDragActive ? 'var(--orange-l)' : 'var(--g50)',
        transition: 'all 0.2s',
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      <input {...getInputProps()} />

      <div style={{ fontSize: '48px', marginBottom: '16px' }}>
        {file ? '📄' : isDragActive ? '📂' : '☁️'}
      </div>

      {file ? (
        <div>
          <p style={{ fontWeight: 600, color: 'var(--g900)', marginBottom: '4px' }}>
            {file.name}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--g500)' }}>
            {(file.size / 1024).toFixed(1)} Ko — Cliquer pour changer
          </p>
        </div>
      ) : (
        <div>
          <p style={{ fontWeight: 600, color: 'var(--g700)', marginBottom: '8px' }}>
            {isDragActive
              ? 'Déposer le fichier ici'
              : 'Glisser-déposer un fichier CSV ou cliquer pour sélectionner'}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--g500)' }}>
            Export Mantis Bug Tracker — format CSV (séparateur ; ou ,)
          </p>
          <p style={{ fontSize: '12px', color: 'var(--g400)', marginTop: '8px' }}>
            Colonnes requises : id, user_id, bug_id, field_name, old_value, new_value, type, date_modified
          </p>
        </div>
      )}
    </div>
  )
}
