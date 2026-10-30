import { useState, useEffect, useRef } from 'react'
import { getMenu, crearPlato, editarPlato, borrarPlato } from '../scripts/api.js'
import { useConfirmar } from '../utils/useConfirmar.jsx'
import '../styles/AdminView.css'

// Tiene que coincidir con el ENUM de menu_items.categoria en la base
const CATEGORIAS = ['entrada', 'principal', 'postre', 'bebida']

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function AdminMenu() {
  const { confirmar, dialogoConfirmar } = useConfirmar()
  const [menu, setMenu] = useState([])
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState('')
  const [precio, setPrecio] = useState('')
  const [editandoId, setEditandoId] = useState(null) // null = agregando un plato nuevo
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null) // { texto, tipo: 'ok' | 'error' }
  const formRef = useRef(null)

  useEffect(() => {
    getMenu()
      .then(setMenu)
      .catch((error) => setMensaje({ texto: error.message, tipo: 'error' }))
  }, [])

  const categorias = CATEGORIAS.filter((c) => menu.some((item) => item.categoria === c))

  function limpiarFormulario() {
    setNombre('')
    setCategoria('')
    setPrecio('')
    setEditandoId(null)
  }

  function handleEditar(plato) {
    setEditandoId(plato.id)
    setNombre(plato.nombre)
    setCategoria(plato.categoria)
    setPrecio(String(plato.precio))
    setMensaje(null)
    // En celular el formulario queda arriba de la lista: lo mostramos
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleBorrar(plato) {
    const confirmado = await confirmar({
      titulo: `¿Borrar "${plato.nombre}"?`,
      mensaje: 'El plato va a desaparecer del menú. Esta acción no se puede deshacer.',
      textoConfirmar: 'Sí, borrar',
      tipo: 'peligro',
    })
    if (!confirmado) return

    setMensaje(null)
    try {
      await borrarPlato(plato.id)
      setMenu((prev) => prev.filter((item) => item.id !== plato.id))
      if (editandoId === plato.id) limpiarFormulario()
      setMensaje({ texto: `"${plato.nombre}" se borró del menú.`, tipo: 'ok' })
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGuardando(true)
    setMensaje(null)
    try {
      if (editandoId) {
        const actualizado = await editarPlato(editandoId, { nombre, categoria, precio })
        setMenu((prev) => prev.map((item) => (item.id === editandoId ? actualizado : item)))
        setMensaje({ texto: `"${actualizado.nombre}" se actualizó.`, tipo: 'ok' })
      } else {
        const plato = await crearPlato({ nombre, categoria, precio })
        setMenu((prev) => [...prev, plato])
        setMensaje({ texto: `"${plato.nombre}" se agregó al menú.`, tipo: 'ok' })
      }
      limpiarFormulario()
    } catch (error) {
      setMensaje({ texto: error.message, tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      {mensaje && (
        <div className={'admin-mensaje' + (mensaje.tipo === 'error' ? ' error' : '')}>
          {mensaje.texto}
        </div>
      )}

      <div className="admin-layout">
        <form ref={formRef} className="card admin-form" onSubmit={handleSubmit}>
          <h3>{editandoId ? 'Editar plato' : 'Agregar plato al menú'}</h3>

          <label className="admin-campo">
            <span>Nombre</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Ravioles con tuco"
              required
            />
          </label>

          <label className="admin-campo">
            <span>Categoría</span>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              required
            >
              <option value="">Elegí una categoría</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {capitalizar(c)}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-campo">
            <span>Precio ($)</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="0.00"
              required
            />
          </label>

          <button type="submit" className="btn-primary" disabled={guardando}>
            {guardando
              ? 'Guardando...'
              : editandoId
                ? 'Guardar cambios'
                : 'Agregar plato'}
          </button>

          {editandoId && (
            <button type="button" className="admin-btn-cancelar" onClick={limpiarFormulario}>
              Cancelar edición
            </button>
          )}
        </form>

        <div className="card admin-menu">
          <h3>Menú actual</h3>
          {menu.length === 0 && <p className="admin-vacio">Todavía no hay platos cargados.</p>}
          {categorias.map((cat) => (
            <div key={cat} className="admin-categoria">
              <h4>{cat}</h4>
              <ul>
                {menu
                  .filter((item) => item.categoria === cat)
                  .map((item) => (
                    <li key={item.id} className={item.id === editandoId ? 'editando' : ''}>
                      <span className="admin-plato-nombre">{item.nombre}</span>
                      <span className="admin-precio">${item.precio}</span>
                      <span className="admin-acciones">
                        <button
                          type="button"
                          className="admin-btn-editar"
                          onClick={() => handleEditar(item)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="admin-btn-borrar"
                          onClick={() => handleBorrar(item)}
                        >
                          Borrar
                        </button>
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {dialogoConfirmar}
    </div>
  )
}

export default AdminMenu