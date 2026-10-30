import { useState, useEffect } from 'react'
import {
  getInsumos,
  crearInsumo,
  editarInsumo,
  ajustarStock,
  getMenu,
  asignarReceta,
} from '../scripts/api.js'
import { useConfirmar } from '../utils/useConfirmar.jsx'
import Modal from './Modal.jsx'
import '../styles/AdminInsumos.css'

function AdminInsumos() {
  const { dialogoConfirmar } = useConfirmar()
  const [insumos, setInsumos] = useState([])
  const [menu, setMenu] = useState([])
  const [mensaje, setMensaje] = useState(null)
  const [panel, setPanel] = useState(null) // 'nuevo' | 'editar' | 'ajustar' | 'receta' | null
  const [insumoActivo, setInsumoActivo] = useState(null)
  const [platoActivo, setPlatoActivo] = useState(null)
  const [recetaDraft, setRecetaDraft] = useState([])
  const [guardando, setGuardando] = useState(false)

  // Form de insumo
  const [nombreForm, setNombreForm] = useState('')
  const [unidadForm, setUnidadForm] = useState('kg')
  const [stockActualForm, setStockActualForm] = useState('')
  const [stockMinimoForm, setStockMinimoForm] = useState('')

  // Form de ajuste
  const [cantidadAjuste, setCantidadAjuste] = useState('')
  const [motivoAjuste, setMotivoAjuste] = useState('compra')

  useEffect(() => {
    let cancelado = false

    const cargarInicial = async () => {
      try {
        const [insumosData, menuData] = await Promise.all([getInsumos(), getMenu()])
        if (cancelado) return
        setInsumos(insumosData)
        setMenu(menuData)
      } catch (error) {
        if (cancelado) return
        setMensaje({ texto: error.message, tipo: 'error' })
      }
    }

    cargarInicial()
    return () => { cancelado = true }
  }, [])

  function cerrarPanel() {
    setPanel(null)
    setInsumoActivo(null)
    setPlatoActivo(null)
    setRecetaDraft([])
    setNombreForm('')
    setUnidadForm('kg')
    setStockActualForm('')
    setStockMinimoForm('')
    setCantidadAjuste('')
    setMotivoAjuste('compra')
  }

  function abrirNuevo() {
    setPanel('nuevo')
    setNombreForm('')
    setUnidadForm('kg')
    setStockActualForm('0')
    setStockMinimoForm('0')
  }

  function abrirEditar(insumo) {
    setInsumoActivo(insumo)
    setPanel('editar')
    setNombreForm(insumo.nombre)
    setUnidadForm(insumo.unidad)
    setStockMinimoForm(String(insumo.stock_minimo))
  }

  function abrirAjustar(insumo) {
    setInsumoActivo(insumo)
    setPanel('ajustar')
    setCantidadAjuste('')
    setMotivoAjuste('compra')
  }

  function abrirReceta(plato) {
    setPlatoActivo(plato)
    setPanel('receta')
    setRecetaDraft([])
  }

  async function handleSubmitInsumo(e) {
    e.preventDefault()
    setGuardando(true)
    setMensaje(null)
    try {
      if (panel === 'nuevo') {
        const creado = await crearInsumo({
          nombre: nombreForm,
          unidad: unidadForm,
          stock_actual: Number(stockActualForm),
          stock_minimo: Number(stockMinimoForm),
        })
        setInsumos((prev) => [...prev, creado])
        setMensaje({ texto: `Insumo ${creado.nombre} creado.`, tipo: 'ok' })
      } else if (panel === 'editar' && insumoActivo) {
        const actualizado = await editarInsumo(insumoActivo.id, {
          nombre: nombreForm,
          unidad: unidadForm,
          stock_minimo: Number(stockMinimoForm),
        })
        setInsumos((prev) => prev.map((i) => (i.id === actualizado.id ? actualizado : i)))
        setMensaje({ texto: `Insumo ${actualizado.nombre} actualizado.`, tipo: 'ok' })
      }
      cerrarPanel()
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  async function handleSubmitAjuste(e) {
    e.preventDefault()
    if (!insumoActivo) return
    const cantidad = Number(cantidadAjuste)
    if (!Number.isFinite(cantidad) || cantidad === 0) {
      setMensaje({ texto: 'La cantidad debe ser un número distinto de 0', tipo: 'error' })
      return
    }
    setGuardando(true)
    setMensaje(null)
    try {
      const actualizado = await ajustarStock(insumoActivo.id, { cantidad, motivo: motivoAjuste })
      setInsumos((prev) => prev.map((i) => (i.id === actualizado.id ? actualizado : i)))
      setMensaje({ texto: `Stock de ${actualizado.nombre} ajustado.`, tipo: 'ok' })
      cerrarPanel()
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  function agregarInsumoAReceta(insumo) {
    if (recetaDraft.some((r) => r.insumo_id === insumo.id)) return
    setRecetaDraft((prev) => [...prev, { insumo_id: insumo.id, nombre: insumo.nombre, cantidad_necesaria: 0 }])
  }

  function cambiarCantidadReceta(insumoId, cantidad) {
    setRecetaDraft((prev) =>
      prev.map((r) => (r.insumo_id === insumoId ? { ...r, cantidad_necesaria: Number(cantidad) } : r))
    )
  }

  function quitarInsumoDeReceta(insumoId) {
    setRecetaDraft((prev) => prev.filter((r) => r.insumo_id !== insumoId))
  }

  async function handleSubmitReceta(e) {
    e.preventDefault()
    if (!platoActivo) return
    if (recetaDraft.length === 0) {
      setMensaje({ texto: 'Agregá al menos un insumo a la receta', tipo: 'error' })
      return
    }
    const conCantidades = recetaDraft.filter((r) => r.cantidad_necesaria > 0)
    if (conCantidades.length === 0) {
      setMensaje({ texto: 'Indicá la cantidad necesaria para cada insumo', tipo: 'error' })
      return
    }
    setGuardando(true)
    setMensaje(null)
    try {
      await asignarReceta(platoActivo.id, conCantidades.map(({ insumo_id, cantidad_necesaria }) => ({
        insumo_id,
        cantidad_necesaria,
      })))
      setMensaje({ texto: `Receta de "${platoActivo.nombre}" guardada.`, tipo: 'ok' })
      cerrarPanel()
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="admin-insumos">
      <div className="admin-insumos-header">
        <h2>Control de Stock</h2>
        <button type="button" className="btn-primary" onClick={abrirNuevo}>
          Agregar insumo
        </button>
      </div>

      {mensaje && (
        <div className={'admin-mensaje' + (mensaje.tipo === 'error' ? ' error' : '')}>
          {mensaje.texto}
        </div>
      )}

      <div className="insumos-grid">
        <h3>Insumos</h3>
        <div className="tabla-scroll">
        <table className="insumos-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Unidad</th>
              <th>Stock actual</th>
              <th>Stock mínimo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {insumos.length === 0 && (
              <tr>
                <td colSpan={6}>No hay insumos cargados todavía.</td>
              </tr>
            )}
            {insumos.map((insumo) => (
              <tr key={insumo.id} className={Number(insumo.bajo_minimo) ? 'bajo-minimo' : ''}>
                <td>{insumo.nombre}</td>
                <td>{insumo.unidad}</td>
                <td className="numero">{Number(insumo.stock_actual).toFixed(2)}</td>
                <td className="numero">{Number(insumo.stock_minimo).toFixed(2)}</td>
                <td>
                  {Number(insumo.bajo_minimo) ? '⚠ Bajo mínimo' : 'OK'}
                </td>
                <td className="acciones">
                  <button type="button" onClick={() => abrirAjustar(insumo)}>
                    Ajustar stock
                  </button>
                  <button type="button" onClick={() => abrirEditar(insumo)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

      <div className="recetas-grid">
        <h3>Recetas por plato</h3>
        <p className="recetas-ayuda">
          Asigná a cada plato los insumos que necesita y en qué cantidad.
          Esto es lo que el sistema descuenta del stock cuando se hace un pedido.
        </p>
        <div className="recetas-lista">
          {menu.map((plato) => (
            <button
              key={plato.id}
              type="button"
              className="receta-card"
              onClick={() => abrirReceta(plato)}
            >
              <div className="receta-card-nombre">{plato.nombre}</div>
              <div className="receta-card-cat">{plato.categoria}</div>
            </button>
          ))}
        </div>
      </div>

      {/* MODAL: Nuevo o editar insumo */}
      {(panel === 'nuevo' || panel === 'editar') && (
        <Modal
          titulo={panel === 'nuevo' ? 'Nuevo insumo' : `Editar ${insumoActivo?.nombre}`}
          onClose={cerrarPanel}
          maxAncho={450}
        >
          <form onSubmit={handleSubmitInsumo} className="insumo-form">
            <label className="admin-campo">
              <span>Nombre</span>
              <input
                type="text"
                value={nombreForm}
                onChange={(e) => setNombreForm(e.target.value)}
                required
                maxLength={100}
                autoFocus
              />
            </label>
            <label className="admin-campo">
              <span>Unidad</span>
              <select value={unidadForm} onChange={(e) => setUnidadForm(e.target.value)}>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="lt">lt</option>
                <option value="ml">ml</option>
                <option value="u">u</option>
              </select>
            </label>
            {panel === 'nuevo' && (
              <label className="admin-campo">
                <span>Stock inicial</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={stockActualForm}
                  onChange={(e) => setStockActualForm(e.target.value)}
                />
              </label>
            )}
            <label className="admin-campo">
              <span>Stock mínimo (alerta)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={stockMinimoForm}
                onChange={(e) => setStockMinimoForm(e.target.value)}
                required
              />
            </label>
            <div className="form-botones">
              <button type="submit" className="btn-primary" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={cerrarPanel}>
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Ajustar stock */}
      {panel === 'ajustar' && insumoActivo && (
        <Modal
          titulo={`Ajustar stock: ${insumoActivo.nombre}`}
          onClose={cerrarPanel}
          maxAncho={450}
        >
          <form onSubmit={handleSubmitAjuste} className="insumo-form">
            <p className="ayuda">
              Stock actual: <strong>{Number(insumoActivo.stock_actual).toFixed(2)} {insumoActivo.unidad}</strong>
            </p>
            <label className="admin-campo">
              <span>Motivo</span>
              <select value={motivoAjuste} onChange={(e) => setMotivoAjuste(e.target.value)}>
                <option value="compra">Compra (+)</option>
                <option value="merma">Merma (−)</option>
                <option value="ajuste">Ajuste manual</option>
              </select>
            </label>
            <label className="admin-campo">
              <span>Cantidad</span>
              <input
                type="number"
                step="0.01"
                value={cantidadAjuste}
                onChange={(e) => setCantidadAjuste(e.target.value)}
                placeholder="Ej: 5 (compra) o -2 (merma)"
                required
                autoFocus
              />
            </label>
            <p className="ayuda">
              Para <strong>compra</strong>: usá número positivo (ej: 5).
              Para <strong>merma</strong>: usá número negativo (ej: -2).
            </p>
            <div className="form-botones">
              <button type="submit" className="btn-primary" disabled={guardando}>
                {guardando ? 'Aplicando...' : 'Aplicar ajuste'}
              </button>
              <button type="button" onClick={cerrarPanel}>
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Receta */}
      {panel === 'receta' && platoActivo && (
        <Modal
          titulo={`Receta: ${platoActivo.nombre}`}
          onClose={cerrarPanel}
          maxAncho={700}
        >
          <form onSubmit={handleSubmitReceta} className="insumo-form">
            <p className="ayuda">
              Agregá los insumos necesarios para preparar 1 unidad de este plato.
            </p>

            <div className="receta-insumos-seleccion">
              <strong>Insumos disponibles:</strong>
              <div className="receta-insumos-botones">
                {insumos.map((ins) => (
                  <button
                    key={ins.id}
                    type="button"
                    onClick={() => agregarInsumoAReceta(ins)}
                    disabled={recetaDraft.some((r) => r.insumo_id === ins.id)}
                  >
                    + {ins.nombre}
                  </button>
                ))}
              </div>
            </div>

            {recetaDraft.length === 0 && (
              <p className="ayuda">Todavía no agregaste insumos.</p>
            )}

            {recetaDraft.length > 0 && (
              <table className="receta-tabla">
                <thead>
                  <tr>
                    <th>Insumo</th>
                    <th>Cantidad necesaria</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recetaDraft.map((r) => (
                    <tr key={r.insumo_id}>
                      <td>{r.nombre}</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={r.cantidad_necesaria}
                          onChange={(e) => cambiarCantidadReceta(r.insumo_id, e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <button type="button" onClick={() => quitarInsumoDeReceta(r.insumo_id)}>
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="form-botones">
              <button type="submit" className="btn-primary" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar receta'}
              </button>
              <button type="button" onClick={cerrarPanel}>
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {dialogoConfirmar}
    </div>
  )
}

export default AdminInsumos