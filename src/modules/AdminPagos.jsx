import { useState, useEffect } from 'react'
import { getPagos, aprobarTransferencia, reembolsarPago } from '../scripts/api.js'
import { useConfirmar } from '../utils/useConfirmar.jsx'
import '../styles/AdminPagos.css'

// FIX: valores en SINGULAR (para que matcheen con el backend), etiquetas en PLURAL (para el usuario)
const FILTROS = [
  { valor: 'pendiente',    etiqueta: 'Pendientes' },
  { valor: 'aprobado',     etiqueta: 'Aprobados' },
  { valor: 'rechazado',    etiqueta: 'Rechazados' },
  { valor: 'reembolsado',  etiqueta: 'Reembolsados' },
  { valor: 'todos',        etiqueta: 'Todos' },
]

function AdminPagos() {
  const { confirmar, dialogoConfirmar } = useConfirmar()
  const [pagos, setPagos] = useState([])
  const [filtro, setFiltro] = useState('pendiente')
  const [mensaje, setMensaje] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [procesandoId, setProcesandoId] = useState(null)

  useEffect(() => {
    let cancelado = false

    const cargar = async () => {
      setCargando(true)
      try {
        // Si el filtro es 'todos', mandamos null para no filtrar
        // Si no, mandamos el valor singular ('pendiente', 'aprobado', etc.)
        const estado = filtro === 'todos' ? null : filtro
        const data = await getPagos(estado)
        if (cancelado) return
        setPagos(data)
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

  async function recargar() {
    try {
      const estado = filtro === 'todos' ? null : filtro
      setPagos(await getPagos(estado))
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' })
    }
  }

  async function handleAprobarTransferencia(pago) {
    const confirmado = await confirmar({
      titulo: `¿Aprobar transferencia #${pago.id}?`,
      mensaje: `Monto: $${Number(pago.monto).toFixed(2)} — Orden #${pago.orden_id}. Verificá que el dinero haya llegado a la cuenta antes de aprobar.`,
      textoConfirmar: 'Sí, aprobar',
      textoCancelar: 'Todavía no',
      icono: 'fa-building-columns',
    })
    if (!confirmado) return

    setProcesandoId(pago.id)
    setMensaje(null)
    try {
      await aprobarTransferencia(pago.id)
      setMensaje({
        texto: `Transferencia #${pago.id} aprobada. Orden #${pago.orden_id} enviada a cocina.`,
        tipo: 'ok',
      })
      await recargar()
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' })
    } finally {
      setProcesandoId(null)
    }
  }

  async function handleReembolsar(pago) {
    const confirmado = await confirmar({
      titulo: `¿Reembolsar pago #${pago.id}?`,
      mensaje: `Vas a reembolsar $${Number(pago.monto).toFixed(2)} pagados por ${pago.pasarela}. La orden #${pago.orden_id} se va a cancelar y el stock se va a devolver.`,
      textoConfirmar: 'Sí, reembolsar',
      textoCancelar: 'Cancelar',
      tipo: 'peligro',
    })
    if (!confirmado) return

    setProcesandoId(pago.id)
    setMensaje(null)
    try {
      await reembolsarPago(pago.id)
      setMensaje({
        texto: `Pago #${pago.id} reembolsado. Orden #${pago.orden_id} cancelada y stock devuelto.`,
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
    const d = new Date(fecha)
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="admin-pagos">
      <div className="admin-pagos-header">
        <h2>Pagos</h2>
        <div className="pagos-filtros" role="tablist">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              type="button"
              role="tab"
              aria-selected={filtro === f.valor}
              className={'pagos-filtro' + (filtro === f.valor ? ' activa' : '')}
              onClick={() => setFiltro(f.valor)}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {mensaje && (
        <div className={'admin-mensaje' + (mensaje.tipo === 'error' ? ' error' : '')}>
          {mensaje.texto}
        </div>
      )}

      {cargando ? (
        <p>Cargando pagos...</p>
      ) : pagos.length === 0 ? (
        <p className="pagos-vacio">No hay pagos en este estado.</p>
      ) : (
        <div className="tabla-scroll">
        <table className="pagos-tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Orden</th>
              <th>Mesa</th>
              <th>Mozo</th>
              <th>Monto</th>
              <th>Pasarela</th>
              <th>Estado</th>
              <th>Referencia</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((pago) => (
              <tr key={pago.id} className={`pago-fila estado-${pago.estado}`}>
                <td>#{pago.id}</td>
                <td>#{pago.orden_id}</td>
                <td>{pago.mesa_numero ? `Mesa ${pago.mesa_numero}` : '-'}</td>
                <td>{pago.mozo_nombre || '-'}</td>
                <td className="monto">${Number(pago.monto).toFixed(2)}</td>
                <td>
                  <span className={`pasarela pasarela-${pago.pasarela}`}>{pago.pasarela}</span>
                </td>
                <td>
                  <span className={`estado estado-${pago.estado}`}>{pago.estado}</span>
                </td>
                <td className="referencia">{pago.referencia_externa || '-'}</td>
                <td className="fecha">{formatearFecha(pago.creado_en)}</td>
                <td className="acciones">
                  {pago.pasarela === 'transferencia' && pago.estado === 'pendiente' && (
                    <button
                      type="button"
                      className="btn-aprobar"
                      onClick={() => handleAprobarTransferencia(pago)}
                      disabled={procesandoId === pago.id}
                    >
                      {procesandoId === pago.id ? '...' : 'Aprobar'}
                    </button>
                  )}
                  {pago.estado === 'aprobado' && (
                    <button
                      type="button"
                      className="btn-reembolsar"
                      onClick={() => handleReembolsar(pago)}
                      disabled={procesandoId === pago.id}
                    >
                      {procesandoId === pago.id ? '...' : 'Reembolsar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {dialogoConfirmar}
    </div>
  )
}

export default AdminPagos