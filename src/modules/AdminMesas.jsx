import { useState, useEffect, useRef } from 'react'
import {
  getMesas,
  crearMesa,
  editarMesa,
  moverMesa,
  borrarMesa,
  liberarMesa,
} from '../scripts/api.js'
import { useConfirmar } from '../utils/useConfirmar.jsx'
import '../styles/AdminMesas.css'

const COLUMNAS_POR_DEFECTO = 4

function limitar(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor))
}

function posicionPorDefecto(indice) {
  return {
    x: 14 + (indice % COLUMNAS_POR_DEFECTO) * 24,
    y: 20 + Math.floor(indice / COLUMNAS_POR_DEFECTO) * 28,
  }
}

function posicionDe(mesa, indice) {
  if (mesa.pos_x != null && mesa.pos_y != null) {
    return { x: Number(mesa.pos_x), y: Number(mesa.pos_y) }
  }
  return posicionPorDefecto(indice)
}

function tamanoMesa(capacidad) {
  return limitar(46 + capacidad * 5, 56, 88)
}

function AdminMesas() {
  const { confirmar, dialogoConfirmar } = useConfirmar()
  const [mesas, setMesas] = useState([])
  const [seleccionadaId, setSeleccionadaId] = useState(null)
  const [modo, setModo] = useState(null) // null | 'editar' | 'nueva'
  const [numero, setNumero] = useState('')
  const [capacidad, setCapacidad] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null) // { texto, tipo: 'ok' | 'error' }
  const planoRef = useRef(null)
  const panelRef = useRef(null)
  const arrastreRef = useRef(null)

  const seleccionada = mesas.find((mesa) => mesa.id === seleccionadaId)

  // Función reutilizable para recargar mesas (la usan los handlers de eventos,
  // no dispara warning porque no se llama desde un effect).
  async function cargarMesas() {
    try {
      setMesas(await getMesas())
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' })
    }
  }

  // ✅ FIX: inline async function + flag de cancelación.
  // Saca el warning de "setState sincrónico dentro de un effect" y evita
  // sets tras desmontar.
  useEffect(() => {
    let cancelado = false

    const cargarInicial = async () => {
      try {
        const data = await getMesas()
        if (cancelado) return
        setMesas(data)
      } catch (error) {
        if (cancelado) return
        setMensaje({ texto: error.message, tipo: 'error' })
      }
    }

    cargarInicial()
    return () => { cancelado = true }
  }, [])

  // Al tocar una mesa (o abrir el formulario) el panel de opciones se muestra
  useEffect(() => {
    if (seleccionadaId !== null || modo === 'nueva') {
      panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [seleccionadaId, modo])

  function seleccionar(id) {
    setSeleccionadaId(id)
    setModo(null)
    setMensaje(null)
  }

  function cerrarPanel() {
    setSeleccionadaId(null)
    setModo(null)
  }

  // ---------- Arrastrar mesas en el plano ----------

  function handlePointerDown(e, mesa, pos) {
    if (e.button !== undefined && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    arrastreRef.current = {
      id: mesa.id,
      inicioX: e.clientX,
      inicioY: e.clientY,
      movida: false,
      x: pos.x,
      y: pos.y,
    }
  }

  function handlePointerMove(e) {
    const arrastre = arrastreRef.current
    if (!arrastre) return
    if (!arrastre.movida && Math.hypot(e.clientX - arrastre.inicioX, e.clientY - arrastre.inicioY) < 6) {
      return
    }

    arrastre.movida = true
    const rect = planoRef.current.getBoundingClientRect()
    arrastre.x = limitar(((e.clientX - rect.left) / rect.width) * 100, 6, 94)
    arrastre.y = limitar(((e.clientY - rect.top) / rect.height) * 100, 8, 92)

    setMesas((prev) =>
      prev.map((mesa) =>
        mesa.id === arrastre.id ? { ...mesa, pos_x: arrastre.x, pos_y: arrastre.y } : mesa
      )
    )
  }

  async function handlePointerUp() {
    const arrastre = arrastreRef.current
    arrastreRef.current = null
    if (!arrastre) return

    if (!arrastre.movida) {
      seleccionar(arrastre.id)
      return
    }

    try {
      const actualizada = await moverMesa(arrastre.id, arrastre.x, arrastre.y)
      setMesas((prev) => prev.map((mesa) => (mesa.id === arrastre.id ? actualizada : mesa)))
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' })
      cargarMesas()
    }
  }

  function handlePointerCancel() {
    if (arrastreRef.current) {
      arrastreRef.current = null
      cargarMesas()
    }
  }

  // ---------- Opciones ----------

  function iniciarNueva() {
    const siguiente = mesas.reduce((max, mesa) => Math.max(max, mesa.numero), 0) + 1
    setSeleccionadaId(null)
    setModo('nueva')
    setNumero(String(siguiente))
    setCapacidad('4')
    setMensaje(null)
  }

  function iniciarEditar() {
    setModo('editar')
    setNumero(String(seleccionada.numero))
    setCapacidad(String(seleccionada.capacidad))
    setMensaje(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setMensaje(null)
    try {
      if (modo === 'nueva') {
        const creada = await crearMesa({ numero, capacidad })
        setMesas((prev) => [...prev, creada])
        setSeleccionadaId(creada.id)
        setMensaje({ texto: `Mesa ${creada.numero} agregada. Arrastrala hasta su lugar.`, tipo: 'ok' })
      } else {
        const actualizada = await editarMesa(seleccionada.id, { numero, capacidad })
        setMesas((prev) => prev.map((mesa) => (mesa.id === actualizada.id ? actualizada : mesa)))
        setMensaje({ texto: `Mesa ${actualizada.numero} actualizada.`, tipo: 'ok' })
      }
      setModo(null)
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  async function handleBorrar() {
    const confirmado = await confirmar({
      titulo: `¿Borrar la Mesa ${seleccionada.numero}?`,
      mensaje: 'La mesa va a desaparecer del plano. Esta acción no se puede deshacer.',
      textoConfirmar: 'Sí, borrar',
      tipo: 'peligro',
    })
    if (!confirmado) return

    setMensaje(null)
    try {
      await borrarMesa(seleccionada.id)
      setMesas((prev) => prev.filter((mesa) => mesa.id !== seleccionada.id))
      setMensaje({ texto: `Mesa ${seleccionada.numero} borrada.`, tipo: 'ok' })
      cerrarPanel()
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' })
    }
  }

  async function handleLiberar() {
    const confirmado = await confirmar({
      titulo: `¿Liberar la Mesa ${seleccionada.numero}?`,
      mensaje: 'Confirmá que ya se cobró. La mesa va a quedar libre para nuevos clientes.',
      textoConfirmar: 'Sí, liberar',
      textoCancelar: 'Todavía no',
      icono: 'fa-door-open',
    })
    if (!confirmado) return

    setMensaje(null)
    try {
      await liberarMesa(seleccionada.id)
      setMesas((prev) =>
        prev.map((mesa) => (mesa.id === seleccionada.id ? { ...mesa, estado: 'libre' } : mesa))
      )
      setMensaje({ texto: `Mesa ${seleccionada.numero} liberada.`, tipo: 'ok' })
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' })
    }
  }

  const ocupada = seleccionada?.estado === 'ocupada'

  return (
    <div>
      <div className="mesas-encabezado">
        <div>
          <h3>Plano del salón</h3>
          <p className="mesas-ayuda">
            Tocá una mesa para ver sus opciones. Arrastrala para cambiar su lugar.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={iniciarNueva}>
          Agregar mesa
        </button>
      </div>

      {mensaje && (
        <div className={'admin-mensaje' + (mensaje.tipo === 'error' ? ' error' : '')}>
          {mensaje.texto}
        </div>
      )}

      <div
        ref={planoRef}
        className="plano"
        onClick={(e) => {
          if (e.target === e.currentTarget) cerrarPanel()
        }}
      >
        {mesas.length === 0 && <p className="plano-vacio">Todavía no hay mesas. Agregá la primera.</p>}

        {mesas.map((mesa, indice) => {
          const pos = posicionDe(mesa, indice)
          return (
            <div
              key={mesa.id}
              role="button"
              tabIndex={0}
              aria-label={`Mesa ${mesa.numero}, ${mesa.capacidad} personas, ${mesa.estado}`}
              className={
                'plano-mesa' +
                (mesa.estado === 'ocupada' ? ' ocupada' : '') +
                (mesa.id === seleccionadaId ? ' seleccionada' : '')
              }
              style={{
                left: `${limitar(pos.x, 6, 94)}%`,
                top: `${limitar(pos.y, 8, 92)}%`,
                '--tam': `${tamanoMesa(mesa.capacidad)}px`,
              }}
              onPointerDown={(e) => handlePointerDown(e, mesa, pos)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  seleccionar(mesa.id)
                }
              }}
            >
              <span className="plano-mesa-numero">{mesa.numero}</span>
              <span className="plano-mesa-capacidad">
                <i className="fa-solid fa-user"></i> {mesa.capacidad}
              </span>
            </div>
          )
        })}
      </div>

      <div className="plano-leyenda">
        <span><i className="leyenda-punto libre"></i> Libre</span>
        <span><i className="leyenda-punto ocupada"></i> Ocupada</span>
      </div>

      {(modo === 'nueva' || seleccionada) && (
        <div ref={panelRef} className="card mesa-panel">
          {modo ? (
            <form onSubmit={handleSubmit} className="mesa-panel-form">
              <h3>{modo === 'nueva' ? 'Agregar mesa' : `Editar mesa ${seleccionada.numero}`}</h3>

              <div className="mesa-panel-campos">
                <label className="admin-campo">
                  <span>Número</span>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    step="1"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    required
                  />
                </label>
                <label className="admin-campo">
                  <span>Capacidad (personas)</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    step="1"
                    value={capacidad}
                    onChange={(e) => setCapacidad(e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="mesa-panel-botones">
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : modo === 'nueva' ? 'Agregar mesa' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  className="mesa-op-btn cerrar"
                  onClick={() => (modo === 'nueva' ? cerrarPanel() : setModo(null))}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="mesa-panel-titulo">
                <h3>Mesa {seleccionada.numero}</h3>
                <span className={'mesa-panel-estado' + (ocupada ? ' ocupada' : '')}>
                  {seleccionada.estado}
                </span>
              </div>
              <p className="mesa-panel-detalle">Capacidad: {seleccionada.capacidad} personas</p>

              <div className="mesa-panel-botones">
                <button type="button" className="mesa-op-btn editar" onClick={iniciarEditar}>
                  Editar
                </button>
                {ocupada && (
                  <button type="button" className="mesa-op-btn liberar" onClick={handleLiberar}>
                    Liberar mesa
                  </button>
                )}
                <button type="button" className="mesa-op-btn borrar" onClick={handleBorrar}>
                  Borrar
                </button>
                <button type="button" className="mesa-op-btn cerrar" onClick={cerrarPanel}>
                  Cerrar
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {dialogoConfirmar}
    </div>
  )
}

export default AdminMesas