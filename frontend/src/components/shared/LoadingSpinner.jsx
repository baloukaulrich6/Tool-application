export default function LoadingSpinner({ text = 'Chargement...' }) {
  return (
    <div className="loading-center">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  )
}
