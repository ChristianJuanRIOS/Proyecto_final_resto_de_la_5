import { useState, useEffect, useCallback } from 'react'
import OrdenCocinaCard from '../modules/OrdenCocinaCard.jsx'
import { getOrdenesCocina, marcarOrdenListo } from '../scripts/api.js'
import '../styles/ChefView.css'

const INTERVALO_REFRESCO_MS = 5000

function ChefView() {
  const [ordenes, setOrdenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [marcandoId, setMarcandoId] = useState(null)

  const cargarOrdenes = useCallback(async () => {
    try {
      const data = await getOrdenesCocina()
      setOrdenes(data)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarOrdenes()
    const intervalo = setInterval(cargarOrdenes, INTERVALO_REFRESCO_MS)
    return () => clearInterval(intervalo)
  }, [cargarOrdenes])

  async function handleMarcarListo(orden) {
    setMarcandoId(orden.id)
    setError(null)
    try {
      await marcarOrdenListo(orden.id)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setMarcandoId(null)
    }
    await cargarOrdenes()
  }

  return (
    <div>
      <div className="chef-header">
        <h1>Vista del Chef</h1>
        <button className="btn-primary" onClick={cargarOrdenes}>
          Actualizar
        </button>
      </div>

      {error && <div className="chef-error">{error}</div>}

      {cargando && <p>Cargando ordenes...</p>}

      {!cargando && ordenes.length === 0 && (
        <p className="chef-vacio">No hay ordenes en cocina por ahora.</p>
      )}

      <div className="chef-grid">
        {ordenes.map((orden) => (
          <OrdenCocinaCard
            key={orden.id}
            orden={orden}
            onListo={() => handleMarcarListo(orden)}
            deshabilitado={marcandoId === orden.id}
          />
        ))}
      </div>
    </div>
  )
}

export default ChefView