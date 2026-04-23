import { useLocation } from 'react-router-dom'

export default function Placeholder() {
  const location = useLocation()
  const stepName = location.pathname.split('/').pop().replace(/-/g, ' ')

  return (
    <div className="text-center">
      <h1 className="text-2xl font-semibold capitalize leading-snug text-text-primary">
        {stepName}
      </h1>
      <p className="mt-3 text-sm text-text-secondary">This step is not built yet.</p>
    </div>
  )
}
