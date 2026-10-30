import '../styles/PedidosListos.css'

// Aviso para el mozo: pedidos que cocina ya dejo listos para servir
function PedidosListos({ ordenes, onEntregar, entregandoId }) {
  if (ordenes.length === 0) return null

  return (
    <section className="pedidos-listos" aria-live="polite">
      <h3 className="pedidos-listos-titulo">
        <i className="fa-solid fa-bell pedidos-listos-campana"></i>
        {ordenes.length === 1
          ? '1 pedido listo para servir'
          : `${ordenes.length} pedidos listos para servir`}
      </h3>

      <div className="pedidos-listos-lista">
        {ordenes.map((orden) => (
          <div key={orden.id} className="pedido-listo">
            <div className="pedido-listo-info">
              <span className="pedido-listo-mesa">Mesa {orden.mesa_numero}</span>
              <span className="pedido-listo-orden">Orden #{orden.id}</span>
              <ul className="pedido-listo-items">
                {orden.items.map((item) => (
                  <li key={item.menu_item_id}>
                    {item.cantidad}x {item.nombre}
                  </li>
                ))}
              </ul>
            </div>

            <button
              className="btn-accent pedido-listo-btn"
              disabled={entregandoId === orden.id}
              onClick={() => onEntregar(orden)}
            >
              {entregandoId === orden.id ? 'Guardando...' : 'Entregado'}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

export default PedidosListos