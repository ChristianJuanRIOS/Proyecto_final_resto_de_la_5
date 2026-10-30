import '../styles/MesaSelector.css'

// mesasConPedidoListo: ids de las mesas que tienen un pedido listo para servir
function MesaSelector({ mesas, mesaSeleccionada, onSeleccionar, onLiberar, mesasConPedidoListo }) {
  return (
    <div className="mesa-selector">
      <h3>Elegí una mesa</h3>
      <div className="mesa-grid">
        {mesas.map((mesa) => {
          const ocupada = mesa.estado === 'ocupada'
          const tienePedidoListo = mesasConPedidoListo?.has(mesa.id)
          return (
            <div key={mesa.id} className="mesa-item">
              <button
                className={
                  'mesa-btn' +
                  (mesaSeleccionada?.id === mesa.id ? ' seleccionada' : '') +
                  (ocupada ? ' ocupada' : '')
                }
                onClick={() => onSeleccionar(mesa)}
              >
                <span className="mesa-numero">Mesa {mesa.numero}</span>
                <span className="mesa-capacidad">{mesa.capacidad} personas</span>
                <span className="mesa-estado">{mesa.estado}</span>
                {tienePedidoListo && <span className="mesa-aviso">Pedido listo</span>}
              </button>

              {ocupada && (
                <button className="mesa-liberar-btn" onClick={() => onLiberar(mesa)}>
                  Liberar mesa
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MesaSelector