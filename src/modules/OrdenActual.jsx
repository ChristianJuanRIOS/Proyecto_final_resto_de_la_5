import '../styles/OrdenActual.css'
import { calcularTotal } from '../utils/pedido.js'

function OrdenActual({ mesa, items, onQuitar, onEnviar, enviando }) {
  const total = calcularTotal(items)

  return (
    <div className="orden-actual card">
      <h3>Orden actual</h3>

      {!mesa && <p className="orden-vacia">Elegi una mesa para empezar.</p>}

      {mesa && items.length === 0 && (
        <p className="orden-vacia">Todavia no agregaste ningun plato.</p>
      )}

      {items.length > 0 && (
        <>
          <ul className="orden-items">
            {items.map((item) => (
              <li key={item.menu_item_id} className="orden-item">
                <span>{item.cantidad}x {item.nombre}</span>
                <span>${item.precio * item.cantidad}</span>
                <button className="quitar-btn" onClick={() => onQuitar(item.menu_item_id)}>
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <div className="orden-total">
            <strong>Total</strong>
            <strong>${total}</strong>
          </div>
        </>
      )}

      <button
        className="btn-accent orden-enviar-btn"
        disabled={!mesa || items.length === 0 || enviando}
        onClick={onEnviar}
      >
        {enviando ? 'Enviando...' : 'Enviar a cocina'}
      </button>
    </div>
  )
}

export default OrdenActual