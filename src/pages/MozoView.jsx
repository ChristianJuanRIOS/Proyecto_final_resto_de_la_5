import { useState, useEffect, useRef, useCallback } from 'react'
import MesaSelector from '../modules/MesaSelector.jsx'
import MenuList from '../modules/MenuList.jsx'
import OrdenActual from '../modules/OrdenActual.jsx'
import PedidosListos from '../modules/PedidosListos.jsx'
import ModalPago from '../modules/ModalPago.jsx'
import ModalPedidoDelivery from '../modules/ModalPedidoDelivery.jsx'
import DeliveryView from '../modules/DeliveryView.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import {
  getMesas,
  getMenu,
  crearOrden,
  liberarMesa,
  getOrdenesListas,
  marcarEntregada,
  cancelarOrden,
} from '../scripts/api.js'
import { sonarAviso } from '../utils/avisoSonoro.js'
import { useConfirmar } from '../utils/useConfirmar.jsx'
import '../styles/MozoView.css'

const INTERVALO_AVISOS_MS = 5000
const TITULO_BASE = 'El resto de la 5'

function MozoView() {
  const { usuario } = useAuth()
  const { confirmar, dialogoConfirmar } = useConfirmar()
  const [mesas, setMesas] = useState([])
  const [menu, setMenu] = useState([])
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
  const [ordenItems, setOrdenItems] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [ordenesListas, setOrdenesListas] = useState([])
  const [entregandoId, setEntregandoId] = useState(null)
  const [modalPago, setModalPago] = useState(null)
  const [modalPedidoDelivery, setModalPedidoDelivery] = useState(false)
  const [vistaSecundaria, setVistaSecundaria] = useState(null) // null | 'delivery'
  const idsListasVistos = useRef(null)

  // Effect 1 — carga inicial de mesas y menú
  useEffect(() => {
    let cancelado = false

    const cargarDatosIniciales = async () => {
      try {
        const [mesasData, menuData] = await Promise.all([getMesas(), getMenu()])
        if (cancelado) return
        setMesas(mesasData)
        setMenu(menuData)
      } catch (error) {
        console.error('Error cargando datos iniciales:', error)
      }
    }

    cargarDatosIniciales()
    return () => { cancelado = true }
  }, [])

  // Polling de pedidos listos
  const cargarListas = useCallback(async () => {
    try {
      const listas = await getOrdenesListas()
      const hayNuevas =
        idsListasVistos.current !== null &&
        listas.some((orden) => !idsListasVistos.current.has(orden.id))

      if (hayNuevas) sonarAviso()
      idsListasVistos.current = new Set(listas.map((orden) => orden.id))
      setOrdenesListas(listas)
    } catch (error) {
      console.error(error)
    }
  }, [])

  useEffect(() => {
    let cancelado = false

    const tick = async () => {
      if (cancelado) return
      await cargarListas()
    }

    tick()
    const intervalo = setInterval(tick, INTERVALO_AVISOS_MS)
    return () => {
      cancelado = true
      clearInterval(intervalo)
    }
  }, [cargarListas])

  // Título de la pestaña con contador de pedidos listos
  useEffect(() => {
    document.title = ordenesListas.length > 0
      ? `(${ordenesListas.length}) Pedido listo - ${TITULO_BASE}`
      : TITULO_BASE
    return () => {
      document.title = TITULO_BASE
    }
  }, [ordenesListas.length])

  const mesasConPedidoListo = new Set(ordenesListas.map((orden) => orden.mesa_id))

  function recargarMesas() {
    return getMesas().then(setMesas).catch(() => {})
  }

  function agregarItem(menuItem) {
    setOrdenItems((prev) => {
      const yaExiste = prev.find((item) => item.menu_item_id === menuItem.id)
      if (yaExiste) {
        return prev.map((item) =>
          item.menu_item_id === menuItem.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      }
      return [
        ...prev,
        {
          menu_item_id: menuItem.id,
          nombre: menuItem.nombre,
          precio: menuItem.precio,
          cantidad: 1,
        },
      ]
    })
  }

  function quitarItem(menuItemId) {
    setOrdenItems((prev) => prev.filter((item) => item.menu_item_id !== menuItemId))
  }

  // ---------- CREAR ORDEN (MESA) Y PAGAR ----------
  async function handleEnviarACocina() {
    setEnviando(true)
    setMensaje(null)
    try {
      const orden = await crearOrden({
        mesaId: mesaSeleccionada.id,
        mesaNumero: mesaSeleccionada.numero,
        mozoNombre: usuario.nombre,
        items: ordenItems,
      })

      // Abrimos el modal de pago (la orden quedó en 'pendiente' esperando pago)
      setModalPago({ orden, montoTotal: orden.monto_total })
      setMensaje({
        texto: `Orden #${orden.id} creada. Procesá el pago para enviarla a cocina.`,
        tipo: 'ok',
      })
    } catch (error) {
      console.error(error)
      setMensaje({ texto: error.message || 'Hubo un error al crear la orden.', tipo: 'error' })
      await recargarMesas()
    } finally {
      setEnviando(false)
    }
  }

  // Cuando el pago se procesa (aprobado, pendiente o rechazado)
  async function handlePagoExitoso(resultado) {
    const { pago, orden } = resultado

    if (pago.estado === 'aprobado') {
      setModalPago(null)
      setOrdenItems([])
      setMesaSeleccionada(null)
      // Solo recargamos mesas si la orden era de mesa (no delivery)
      if (orden.mesa_id) {
        await recargarMesas()
      }
      setMensaje({
        texto: `Orden #${orden.id} pagada y enviada a cocina. (Pasarela: ${pago.pasarela}, Ref: ${pago.referencia_externa})`,
        tipo: 'ok',
      })
    } else if (pago.estado === 'pendiente') {
      setModalPago(null)
      setOrdenItems([])
      setMesaSeleccionada(null)
      if (orden.mesa_id) {
        await recargarMesas()
      }
      setMensaje({
        texto: `Orden #${orden.id} pagada con transferencia. Pendiente de aprobación por admin.`,
        tipo: 'ok',
      })
    } else if (pago.estado === 'rechazado') {
      // Recalculamos montoTotal desde los items (la respuesta del pago no trae monto_total)
      const montoItems = (orden.items || []).reduce(
        (sum, item) => sum + Number(item.precio || 0) * Number(item.cantidad || 0),
        0
      )
      // Mantener el envío si lo había (para delivery)
      const envioPrevio = modalPago?.envio
      const montoTotalRecalculado = envioPrevio
        ? montoItems + Number(envioPrevio.costo)
        : montoItems
      setModalPago({
        orden,
        montoTotal: montoTotalRecalculado,
        envio: envioPrevio,
      })
      setMensaje({
        texto: `Pago rechazado por la pasarela. La orden #${orden.id} sigue pendiente.`,
        tipo: 'error',
      })
    }
  }

  // Si el mozo decide cancelar la orden en vez de pagarla
  async function handleCancelarPago() {
    if (!modalPago) return
    const ordenId = modalPago.orden.id
    try {
      await cancelarOrden(ordenId)
      setModalPago(null)
      setOrdenItems([])
      setMesaSeleccionada(null)
      if (modalPago.orden.mesa_id) {
        await recargarMesas()
      }
      setMensaje({
        texto: `Orden #${ordenId} cancelada. Stock devuelto.`,
        tipo: 'ok',
      })
    } catch (error) {
      setMensaje({ texto: error.message || 'No se pudo cancelar la orden', tipo: 'error' })
    }
  }

  // ---------- NUEVO PEDIDO DELIVERY ----------
  // Cuando se crea el pedido delivery, abrimos el ModalPago con la info del envío
  function handleDeliveryCreado(resultado) {
    setModalPedidoDelivery(false)
    const { orden, delivery, costo_envio, monto_total } = resultado

    // Descripción legible de la modalidad de envío
    function descripcionEnvio(modalidad) {
      switch (modalidad) {
        case 'moto_propia': return 'Moto propia'
        case 'cadeteria_externa': return 'Cadetería externa'
        case 'retiro_local': return 'Retiro en local'
        default: return modalidad
      }
    }

    setMensaje({
      texto: `Pedido delivery #${delivery.id} creado. Procesá el pago para enviar a cocina.`,
      tipo: 'ok',
    })
    setModalPago({
      orden,
      montoTotal: monto_total,
      envio: {
        descripcion: descripcionEnvio(delivery.modalidad_envio),
        costo: costo_envio,
      },
    })
  }

  // ---------- LIBERAR MESA ----------
  async function handleLiberarMesa(mesa) {
    const confirmado = await confirmar({
      titulo: `¿Liberar la Mesa ${mesa.numero}?`,
      mensaje: 'Confirmá que ya se cobró. La mesa va a quedar libre para nuevos clientes.',
      textoConfirmar: 'Sí, liberar',
      textoCancelar: 'Todavía no',
      icono: 'fa-door-open',
    })
    if (!confirmado) return

    setMensaje(null)
    try {
      await liberarMesa(mesa.id)
      if (mesaSeleccionada?.id === mesa.id) setMesaSeleccionada(null)
      setMensaje({ texto: `Mesa ${mesa.numero} liberada.`, tipo: 'ok' })
      await recargarMesas()
    } catch (error) {
      console.error(error)
      setMensaje({ texto: error.message || 'No se pudo liberar la mesa.', tipo: 'error' })
    }
  }

  // ---------- ENTREGAR PEDIDO LISTO ----------
  async function handleEntregar(orden) {
    setEntregandoId(orden.id)
    setMensaje(null)
    try {
      await marcarEntregada(orden.id)
    } catch (error) {
      console.error(error)
      setMensaje({ texto: error.message || 'No se pudo marcar como entregado.', tipo: 'error' })
    } finally {
      setEntregandoId(null)
    }
    await cargarListas()
  }

  return (
    <div>
      <div className="mozo-header">
        <h1>Vista del Mozo</h1>
        <div className="mozo-header-acciones">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setVistaSecundaria(vistaSecundaria === 'delivery' ? null : 'delivery')}
          >
            {vistaSecundaria === 'delivery' ? 'Volver a mesas' : 'Ver pedidos delivery'}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setModalPedidoDelivery(true)}
          >
            <i className="fa-solid fa-motorcycle"></i> Nuevo delivery
          </button>
        </div>
      </div>

      {mensaje && (
        <div className={'mozo-mensaje' + (mensaje.tipo === 'error' ? ' error' : '')}>
          {mensaje.texto}
        </div>
      )}

      {vistaSecundaria === 'delivery' ? (
        <DeliveryView />
      ) : (
        <>
          <PedidosListos
            ordenes={ordenesListas}
            onEntregar={handleEntregar}
            entregandoId={entregandoId}
          />

          <div className="mozo-layout">
            <div className="mozo-columna-principal">
              <MesaSelector
                mesas={mesas}
                mesaSeleccionada={mesaSeleccionada}
                onSeleccionar={setMesaSeleccionada}
                onLiberar={handleLiberarMesa}
                mesasConPedidoListo={mesasConPedidoListo}
              />
              <MenuList menu={menu} onAgregar={agregarItem} />
            </div>

            <div className="mozo-columna-orden">
              <OrdenActual
                mesa={mesaSeleccionada}
                items={ordenItems}
                onQuitar={quitarItem}
                onEnviar={handleEnviarACocina}
                enviando={enviando}
              />
            </div>
          </div>
        </>
      )}

      {modalPago && (
        <ModalPago
          orden={modalPago.orden}
          monto={modalPago.montoTotal}
          envio={modalPago.envio}
          onExito={handlePagoExitoso}
          onCancelarOrden={handleCancelarPago}
        />
      )}

      {modalPedidoDelivery && (
        <ModalPedidoDelivery
          menu={menu}
          onExito={handleDeliveryCreado}
          onCerrar={() => setModalPedidoDelivery(false)}
        />
      )}

      {dialogoConfirmar}
    </div>
  )
}

export default MozoView