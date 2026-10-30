import { useState, useEffect, useCallback } from 'react'
import OrdenCocinaCard from '../modules/OrdenCocinaCard.jsx'
import { getOrdenesCocina } from '../scripts/api.js'
import '../styles/CocineroView.css'

const INTERVALO_REFRESCO_MS = 5000

function CocineroView() {
  const [ordenes, setOrdenes] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargarOrdenes = useCallback(async () => {
    const data = await getOrdenesCocina()
    setOrdenes(data)
    setCargando(false)
  }, [])

  useEffect(() => {
    cargarOrdenes()
    const intervalo = setInterval(cargarOrdenes, INTERVALO_REFRESCO_MS)
    return () => clearInterval(intervalo)
  }, [cargarOrdenes])

  return (
    <div>
      <div className="cocinero-header">
        <h1>Vista del Cocinero</h1>
        <button className="btn-primary" onClick={cargarOrdenes}>
          Actualizar
        </button>
      </div>

      {cargando && <p>Cargando ordenes...</p>}

      {!cargando && ordenes.length === 0 && (
        <p className="cocinero-vacio">No hay ordenes pendientes por ahora.</p>
      )}

      <div className="cocinero-grid">
        {ordenes.map((orden) => (
          <OrdenCocinaCard key={orden.id} orden={orden} />
        ))}
      </div>
    </div>
  )
}

export default CocineroView