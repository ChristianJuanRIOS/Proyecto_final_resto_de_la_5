import '../styles/OrdenCocinaCard.css'

function formatearHora(isoString) {
  if (!isoString) return ''
  const fecha = new Date(isoString)
  return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

// onListo es opcional: si se pasa, la tarjeta muestra el boton "Marcar como listo" (chef)
function OrdenCocinaCard({ orden, onListo, deshabilitado = false }) {
  return (
    <div className="orden-cocina-card card">
      <div className="orden-cocina-header">
        <span className="orden-cocina-mesa">Mesa {orden.mesa_numero}</span>
        <span className="orden-cocina-hora">{formatearHora(orden.enviado_cocina_en)}</span>
      </div>

      <span className="orden-cocina-mozo">Mozo: {orden.mozo_nombre}</span>

      <ul className="orden-cocina-items">
        {orden.items.map((item) => (
          <li key={item.menu_item_id}>
            <span className="orden-cocina-cantidad">{item.cantidad}x</span>
            <span>{item.nombre}</span>
          </li>
        ))}
      </ul>

      {onListo && (
        <button
          className="btn-accent orden-cocina-listo-btn"
          disabled={deshabilitado}
          onClick={onListo}
        >
          {deshabilitado ? 'Marcando...' : 'Marcar como listo'}
        </button>
      )}
    </div>
  )
}

export default OrdenCocinaCard