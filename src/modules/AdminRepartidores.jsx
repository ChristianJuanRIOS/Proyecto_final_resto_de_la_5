import { useState, useEffect } from 'react'
import {
  getRepartidores,
  crearRepartidor,
  editarRepartidor,
  borrarRepartidor,
} from '../scripts/api.js'
import { useConfirmar } from '../utils/useConfirmar.jsx'
import Modal from './Modal.jsx'
import '../styles/AdminRepartidores.css'

function AdminRepartidores() {
  const { confirmar, dialogoConfirmar } = useConfirmar()
  const [repartidores, setRepartidores] = useState([])
  const [mensaje, setMensaje] = useState(null)
  const [panel, setPanel] = useState(null) // 'nuevo' | 'editar' | null
  const [activo, setActivo] = useState(null)
  const [nombreForm, setNombreForm] = useState('')
  const [contactoForm, setContactoForm] = useState('')
  const [activoForm, setActivoForm] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let cancelado = false
    const cargar = async () => {
      try {
        const data = await getRepartidores()
        if (cancelado) return
        setRepartidores(data)
      } catch (error) {
        if (cancelado) return
        setMensaje({ texto: error.message, tipo: 'error' })
      }
    }
    cargar()
    return () => { cancelado = true }
  }, [])

  async function recargar() {
    try {
      setRepartidores(await getRepartidores())
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' })
    }
  }

  function cerrarPanel() {
    setPanel(null)
    setActivo(null)
    setNombreForm('')
    setContactoForm('')
    setActivoForm(true)
  }

  function abrirNuevo() {
    setPanel('nuevo')
    setNombreForm('')
    setContactoForm('')
    setActivoForm(true)
  }

  function abrirEditar(r) {
    setActivo(r)
    setPanel('editar')
    setNombreForm(r.nombre)
    setContactoForm(r.contacto || '')
    setActivoForm(r.activo)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setMensaje(null)
    try {
      if (panel === 'nuevo') {
        const creado = await crearRepartidor({ nombre: nombreForm, contacto: contactoForm })
        setRepartidores((prev) => [...prev, creado])
        setMensaje({ texto: `Repartidor ${creado.nombre} creado.`, tipo: 'ok' })
      } else if (panel === 'editar' && activo) {
        const actualizado = await editarRepartidor(activo.id, {
          nombre: nombreForm,
          contacto: contactoForm,
          activo: activoForm,
        })
        setRepartidores((prev) => prev.map((r) => (r.id === actualizado.id ? actualizado : r)))
        setMensaje({ texto: `Repartidor ${actualizado.nombre} actualizado.`, tipo: 'ok' })
      }
      cerrarPanel()
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  async function handleBorrar(r) {
    const confirmado = await confirmar({
      titulo: `¿Borrar a ${r.nombre}?`,
      mensaje: 'Si el repartidor ya tiene pedidos asignados, no se podrá borrar.',
      textoConfirmar: 'Sí, borrar',
      tipo: 'peligro',
    })
    if (!confirmado) return
    try {
      await borrarRepartidor(r.id)
      setRepartidores((prev) => prev.filter((x) => x.id !== r.id))
      setMensaje({ texto: `${r.nombre} borrado.`, tipo: 'ok' })
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' })
    }
  }

  return (
    <div className="admin-repartidores">
      <div className="admin-repartidores-header">
        <h2>Repartidores</h2>
        <button type="button" className="btn-primary" onClick={abrirNuevo}>
          Agregar repartidor
        </button>
      </div>

      {mensaje && (
        <div className={'admin-mensaje' + (mensaje.tipo === 'error' ? ' error' : '')}>
          {mensaje.texto}
        </div>
      )}

      <div className="tabla-scroll">
      <table className="repartidores-tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Contacto</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {repartidores.length === 0 && (
            <tr><td colSpan={4}>No hay repartidores cargados.</td></tr>
          )}
          {repartidores.map((r) => (
            <tr key={r.id} className={!r.activo ? 'inactivo' : ''}>
              <td>{r.nombre}</td>
              <td>{r.contacto || '-'}</td>
              <td>
                <span className={`repartidor-estado ${r.activo ? 'activo' : 'inactivo'}`}>
                  {r.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="acciones">
                <button type="button" onClick={() => abrirEditar(r)}>Editar</button>
                <button type="button" onClick={() => handleBorrar(r)}>Borrar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {panel && (
        <Modal
          titulo={panel === 'nuevo' ? 'Nuevo repartidor' : `Editar ${activo?.nombre}`}
          onClose={cerrarPanel}
          maxAncho={450}
        >
          <form onSubmit={handleSubmit} className="repartidor-form">
            <label className="campo">
              <span>Nombre *</span>
              <input
                type="text"
                value={nombreForm}
                onChange={(e) => setNombreForm(e.target.value)}
                required
                autoFocus
              />
            </label>
            <label className="campo">
              <span>Contacto (teléfono)</span>
              <input
                type="text"
                value={contactoForm}
                onChange={(e) => setContactoForm(e.target.value)}
                placeholder="11-5555-1234"
              />
            </label>
            {panel === 'editar' && (
              <label className="campo-check">
                <input
                  type="checkbox"
                  checked={activoForm}
                  onChange={(e) => setActivoForm(e.target.checked)}
                />
                <span>Repartidor activo (puede recibir pedidos)</span>
              </label>
            )}
            <div className="form-botones">
              <button type="submit" className="btn-primary" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={cerrarPanel}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {dialogoConfirmar}
    </div>
  )
}

export default AdminRepartidores