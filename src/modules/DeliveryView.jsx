import { useState, useEffect } from 'react'
import {
  getPedidosDelivery,
  getRepartidores,
  asignarRepartidor,
  entregarDelivery,
} from '../scripts/api.js'
import { useConfirmar } from '../utils/useConfirmar.jsx'
import Modal from './Modal.jsx'
import '../styles/DeliveryView.css'

const FILTROS = [
  { valor: 'en_preparacion', etiqueta: 'En preparación' },
  { valor: 'en_camino',      etiqueta: 'En camino' },
  { valor: 'entregado',      etiqueta: 'Entregados' },
  { valor: 'todos',          etiqueta: 'Todos' },
]

function DeliveryView() {
  const { confirmar, dialogoConfirmar } = useConfirmar()
  const [pedidos, setPedidos] = useState([])
  const [repartidores, setRepartidores] = useState([])
  const [filtro, setFiltro] = useState('en_preparacion')
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [pedidoAsignando, setPedidoAsignando] = useState(null) // pedido al que se le asigna repartidor
  const [procesandoId, setProcesandoId] = useState(null)

  useEffect(() => {
    let cancelado = false

    const cargar = async () => {
      setCargando(true)
      try {
        const estado = filtro === 'todos' ? null : filtro
        const data = await getPedidosDelivery(estado)
        if (cancelado) return
        setPedidos(data)
        setMensaje(null)
      } catch (error) {
        if (cancelado) return
        setMensaje({ texto: error.message, tipo: 'error' })
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    cargar()
    return () => { cancelado = true }
  }, [filtro])

  useEffect(() => {
    let cancelado = false
    const cargarRepartidores = async () => {
      try {
        const data = await getRepartidores()
        if (cancelado) return
        setRepartidores(data.filter((r) => r.activo))
      } catch (e) {
        // Silencioso: si falla, no rompemos la vista
      }
    }
    cargarRepartidores()
    return () => { cancelado = true }
  }, [])

  async function recargar() {
    try {
      const estado = filtro === 'todos' ? null : filtro
      setPedidos(await getPedidosDelivery(estado))
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' })
    }
  }

  async function handleAsignar(pedido, repartidorId) {
    const repartidor = repartidores.find((r) => r.id === repartidorId)
    const confirmado = await confirmar({
      titulo: `¿Asignar a ${repartidor.nombre}?`,
      mensaje: `Pedido #${pedido.id} — ${pedido.cliente_nombre} — ${pedido.direccion}. El repartidor va a salir con el pedido.`,
      textoConfirmar: 'Sí, asignar',
      textoCancelar: 'Cancelar',
      icono: 'fa-motorcycle',
    })
    if (!confirmado) return

    setProcesandoId(pedido.id)
    setMensaje(null)
    try {
      await asignarRepartidor(pedido.id, repartidorId)
      setMensaje({
        texto: `Repartidor asignado. Pedido #${pedido.id} en camino.`,
        tipo: 'ok',
      })
      setPedidoAsignando(null)
      await recargar()
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' })
    } finally {
      setProcesandoId(null)
    }
  }

  async function handleEntregar(pedido) {
    const confirmado = await confirmar({
      titulo: `¿Marcar como entregado el pedido #${pedido.id}?`,
      mensaje: `Confirmá que el repartidor ${pedido.repartidor_nombre} entregó el pedido a ${pedido.cliente_nombre}.`,
      textoConfirmar: 'Sí, entregado',
      textoCancelar: 'Todavía no',
      icono: 'fa-circle-check',
    })
    if (!confirmado) return

    setProcesandoId(pedido.id)
    setMensaje(null)
    try {
      await entregarDelivery(pedido.id)
      setMensaje({
        texto: `Pedido #${pedido.id} entregado.`,
        tipo: 'ok',
      })
      await recargar()
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' })
    } finally {
      setProcesandoId(null)
    }
  }

  function formatearFecha(fecha) {
    if (!fecha) return '-'
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  function descripcionModalidad(m) {
    switch (m) {
      case 'moto_propia': return 'Moto propia'
      case 'cadeteria_externa': return 'Cadetería externa'
      case 'retiro_local': return 'Retiro en local'
      default: return m
    }
  }

  return (
    <div className="delivery-view">
      <div className="delivery-view-header">
        <h2>Pedidos de delivery</h2>
        <div className="delivery-filtros">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              type="button"
              className={'delivery-filtro' + (filtro === f.valor ? ' activa' : '')}
              onClick={() => setFiltro(f.valor)}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {mensaje && (
        <div className={'delivery-mensaje' + (mensaje.tipo === 'error' ? ' error' : '')}>
          {mensaje.texto}
        </div>
      )}

      {cargando ? (
        <p>Cargando...</p>
      ) : pedidos.length === 0 ? (
        <p className="delivery-vacio">No hay pedidos en este estado.</p>
      ) : (
        <div className="delivery-cards">
          {pedidos.map((p) => (
            <div key={p.id} className={`delivery-card estado-${p.estado}`}>
              <div className="delivery-card-header">
                <span className="delivery-card-id">#{p.id}</span>
                <span className={`delivery-card-estado estado-${p.estado}`}>{p.estado.replace('_', ' ')}</span>
                <span className="delivery-card-orden">Orden #{p.orden_id} · {p.orden_estado}</span>
              </div>
              <div className="delivery-card-body">
                <div className="delivery-card-row">
                  <strong>Cliente:</strong> {p.cliente_nombre}
                </div>
                <div className="delivery-card-row">
                  <strong>Dirección:</strong> {p.direccion}
                </div>
                {p.observaciones && (
                  <div className="delivery-card-row">
                    <strong>Obs:</strong> <em>{p.observaciones}</em>
                  </div>
                )}
                {p.telefono && (
                  <div className="delivery-card-row">
                    <strong>Tel:</strong> {p.telefono}
                  </div>
                )}
                <div className="delivery-card-row">
                  <strong>Items:</strong> {p.items.map((it) => `${it.cantidad}× ${it.nombre}`).join(', ')}
                </div>
                <div className="delivery-card-row">
                  <strong>Envío:</strong> {descripcionModalidad(p.modalidad_envio)} — ${Number(p.costo_envio).toFixed(2)}
                </div>
                {p.repartidor_nombre && (
                  <div className="delivery-card-row">
                    <strong>Repartidor:</strong> {p.repartidor_nombre} ({p.repartidor_contacto || 's/contacto'})
                  </div>
                )}
                <div className="delivery-card-row delivery-card-fecha">
                  {formatearFecha(p.creado_en)}
                </div>
              </div>
              <div className="delivery-card-acciones">
                {p.orden_estado === 'listo' && p.estado === 'en_preparacion' && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setPedidoAsignando(p)}
                    disabled={procesandoId === p.id}
                  >
                    Asignar repartidor
                  </button>
                )}
                {p.estado === 'en_camino' && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleEntregar(p)}
                    disabled={procesandoId === p.id}
                  >
                    {procesandoId === p.id ? '...' : 'Marcar entregado'}
                  </button>
                )}
                {p.orden_estado === 'pendiente' && (
                  <span className="delivery-card-pago-pendiente">
                    ⚠ Pago pendiente
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: asignar repartidor */}
      {pedidoAsignando && (
        <Modal
          titulo={`Asignar repartidor — Pedido #${pedidoAsignando.id}`}
          onClose={() => setPedidoAsignando(null)}
          maxAncho={500}
        >
          <div className="delivery-asignar-info">
            <p><strong>Cliente:</strong> {pedidoAsignando.cliente_nombre}</p>
            <p><strong>Dirección:</strong> {pedidoAsignando.direccion}</p>
            <p><strong>Envío:</strong> {descripcionModalidad(pedidoAsignando.modalidad_envio)} — ${Number(pedidoAsignando.costo_envio).toFixed(2)}</p>
          </div>
          <div className="delivery-asignar-lista">
            <h4>Repartidores disponibles</h4>
            {repartidores.length === 0 ? (
              <p className="delivery-vacio">No hay repartidores activos. Agregá uno desde Admin → Repartidores.</p>
            ) : (
              repartidores.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="delivery-repartidor-btn"
                  onClick={() => handleAsignar(pedidoAsignando, r.id)}
                  disabled={procesandoId === pedidoAsignando.id}
                >
                  <i className="fa-solid fa-motorcycle"></i>
                  <span>{r.nombre}</span>
                  {r.contacto && <small>{r.contacto}</small>}
                </button>
              ))
            )}
          </div>
        </Modal>
      )}

      {dialogoConfirmar}
    </div>
  )
}

export default DeliveryView