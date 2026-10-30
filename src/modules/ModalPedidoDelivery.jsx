import { useState } from 'react'
import Modal from './Modal.jsx'
import MenuList from './MenuList.jsx'
import { calcularEnvio, crearPedidoDelivery } from '../scripts/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import '../styles/ModalPedidoDelivery.css'

const MODALIDADES = [
  { valor: 'moto_propia',        etiqueta: 'Moto propia',        icono: 'fa-motorcycle',      requiereDistancia: true },
  { valor: 'cadeteria_externa',  etiqueta: 'Cadetería externa', icono: 'fa-truck',           requiereDistancia: false },
  { valor: 'retiro_local',       etiqueta: 'Retiro en local',    icono: 'fa-store',           requiereDistancia: false },
]

function ModalPedidoDelivery({ menu, onExito, onCerrar }) {
  const { usuario } = useAuth()
  const [items, setItems] = useState([])
  const [clienteNombre, setClienteNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [telefono, setTelefono] = useState('')
  const [modalidad, setModalidad] = useState('moto_propia')
  const [distanciaKm, setDistanciaKm] = useState('5')
  const [calculoEnvio, setCalculoEnvio] = useState(null)
  const [calculando, setCalculando] = useState(false)
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState(null)

  function agregarItem(menuItem) {
    setItems((prev) => {
      const yaExiste = prev.find((it) => it.menu_item_id === menuItem.id)
      if (yaExiste) {
        return prev.map((it) =>
          it.menu_item_id === menuItem.id
            ? { ...it, cantidad: it.cantidad + 1 }
            : it
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
    setCalculoEnvio(null) // invalidar el cálculo anterior si cambiaron los items
  }

  function quitarItem(menuItemId) {
    setItems((prev) => prev.filter((it) => it.menu_item_id !== menuItemId))
    setCalculoEnvio(null)
  }

  function cambiarCantidad(menuItemId, cantidad) {
    setItems((prev) =>
      prev.map((it) =>
        it.menu_item_id === menuItemId
          ? { ...it, cantidad: Number(cantidad) || 1 }
          : it
      )
    )
    setCalculoEnvio(null)
  }

  const montoItems = items.reduce(
    (suma, it) => suma + Number(it.precio) * Number(it.cantidad),
    0
  )

  async function handleCalcularEnvio() {
    if (items.length === 0) {
      setError('Agregá al menos un plato antes de calcular el envío')
      return
    }
    setCalculando(true)
    setError(null)
    try {
      const resultado = await calcularEnvio({
        modalidad,
        subtotal: montoItems,
        distancia_km: Number(distanciaKm) || null,
      })
      setCalculoEnvio(resultado)
    } catch (err) {
      setError(err.message)
    } finally {
      setCalculando(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (items.length === 0) {
      setError('Agregá al menos un plato al pedido')
      return
    }
    if (!clienteNombre || !direccion) {
      setError('Completá el nombre del cliente y la dirección')
      return
    }
    if (!calculoEnvio) {
      setError('Calculá el costo de envío antes de confirmar el pedido')
      return
    }

    setCreando(true)
    try {
      const resultado = await crearPedidoDelivery({
        mozoNombre: usuario.nombre,
        items,
        cliente_nombre: clienteNombre,
        direccion,
        observaciones: observaciones || undefined,
        telefono: telefono || undefined,
        modalidad_envio: modalidad,
        distancia_km: Number(distanciaKm) || null,
      })
      onExito(resultado)
    } catch (err) {
      let msg = err.message
      if (err.faltantes && err.faltantes.length > 0) {
        const lista = err.faltantes
          .map((f) => `${f.insumo} (necesario: ${f.necesario}, disponible: ${f.disponible})`)
          .join(', ')
        msg = `Stock insuficiente: ${lista}`
      }
      setError(msg)
    } finally {
      setCreando(false)
    }
  }

  return (
    <Modal
      titulo="Nuevo pedido de delivery"
      onClose={onCerrar}
      maxAncho={800}
    >
      <form onSubmit={handleSubmit} className="delivery-form">
        {/* Sección 1: Items del pedido */}
        <div className="delivery-seccion">
          <h4>1. Items del pedido</h4>
          {items.length > 0 && (
            <ul className="delivery-items">
              {items.map((it) => (
                <li key={it.menu_item_id} className="delivery-item">
                  <span className="delivery-item-nombre">{it.nombre}</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={it.cantidad}
                    onChange={(e) => cambiarCantidad(it.menu_item_id, e.target.value)}
                    className="delivery-item-cantidad"
                  />
                  <span className="delivery-item-precio">
                    ${(Number(it.precio) * Number(it.cantidad)).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => quitarItem(it.menu_item_id)}
                    className="delivery-item-quitar"
                    aria-label="Quitar"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="delivery-menu-lista">
            <MenuList menu={menu} onAgregar={agregarItem} />
          </div>
        </div>

        {/* Sección 2: Datos del cliente */}
        <div className="delivery-seccion">
          <h4>2. Datos del cliente</h4>
          <label className="delivery-campo">
            <span>Nombre del cliente *</span>
            <input
              type="text"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              placeholder="María García"
              required
            />
          </label>
          <label className="delivery-campo">
            <span>Dirección de entrega *</span>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Av. San Martín 123, Piso 2, Dpto B"
              required
            />
          </label>
          <label className="delivery-campo">
            <span>Teléfono</span>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="11-5555-4444"
            />
          </label>
          <label className="delivery-campo">
            <span>Observaciones</span>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Tocar timbre 2B. Edificio gris."
              rows={2}
            />
          </label>
        </div>

        {/* Sección 3: Modalidad de envío */}
        <div className="delivery-seccion">
          <h4>3. Modalidad de envío</h4>
          <div className="delivery-modalidades">
            {MODALIDADES.map((m) => (
              <label
                key={m.valor}
                className={'delivery-modalidad' + (modalidad === m.valor ? ' seleccionada' : '')}
              >
                <input
                  type="radio"
                  name="modalidad"
                  value={m.valor}
                  checked={modalidad === m.valor}
                  onChange={() => { setModalidad(m.valor); setCalculoEnvio(null) }}
                />
                <i className={'fa-solid ' + m.icono}></i>
                <span>{m.etiqueta}</span>
              </label>
            ))}
          </div>
          {modalidad === 'moto_propia' && (
            <label className="delivery-campo delivery-campo-corto">
              <span>Distancia estimada (km)</span>
              <input
                type="number"
                min="1"
                max="50"
                step="0.5"
                value={distanciaKm}
                onChange={(e) => { setDistanciaKm(e.target.value); setCalculoEnvio(null) }}
                placeholder="5"
              />
            </label>
          )}
          <button
            type="button"
            onClick={handleCalcularEnvio}
            disabled={calculando || items.length === 0}
            className="btn-secondary"
          >
            {calculando ? 'Calculando...' : 'Calcular costo de envío'}
          </button>
          {calculoEnvio && (
            <div className="delivery-resumen-costo">
              <div className="delivery-linea">
                <span>Items ({items.reduce((s, it) => s + it.cantidad, 0)} platos)</span>
                <span>${montoItems.toFixed(2)}</span>
              </div>
              <div className="delivery-linea">
                <span>Envío — {calculoEnvio.descripcion}</span>
                <span>${calculoEnvio.costo.toFixed(2)}</span>
              </div>
              <div className="delivery-linea delivery-total">
                <strong>Total</strong>
                <strong>${(montoItems + calculoEnvio.costo).toFixed(2)}</strong>
              </div>
            </div>
          )}
        </div>

        {error && <div className="delivery-error">{error}</div>}

        <div className="delivery-botones">
          <button type="submit" className="btn-primary" disabled={creando || !calculoEnvio}>
            {creando ? 'Creando...' : 'Crear pedido de delivery'}
          </button>
          <button type="button" onClick={onCerrar} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ModalPedidoDelivery