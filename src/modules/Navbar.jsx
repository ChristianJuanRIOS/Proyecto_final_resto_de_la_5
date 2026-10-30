import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useTema } from '../contexts/ThemeContext.jsx'
import '../styles/Navbar.css'

function Navbar() {
  const { usuario, logout } = useAuth()
  const { oscuro, alternarTema } = useTema()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)

  // Solo el admin tiene varias secciones, asi que solo el admin usa la hamburguesa
  const esAdmin = usuario?.rol === 'admin'

  // Al navegar a otra pagina se cierra el menu
  useEffect(() => {
    setMenuAbierto(false)
  }, [location.pathname])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header
      className={
        'navbar' + (esAdmin ? ' navbar-admin' : '') + (menuAbierto ? ' menu-abierto' : '')
      }
    >
      <div className="navbar-brand">El resto de la 5</div>

      {esAdmin && (
        <button
          type="button"
          className="navbar-hamburguesa"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
          aria-controls="navbar-menu"
        >
          <i className={'fa-solid ' + (menuAbierto ? 'fa-xmark' : 'fa-bars')}></i>
        </button>
      )}

      <nav id="navbar-menu" className="navbar-links">
        {(usuario?.rol === 'mozo' || usuario?.rol === 'admin') && (
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            Mozo
          </NavLink>
        )}
        {(usuario?.rol === 'cocinero' || usuario?.rol === 'admin') && (
          <NavLink to="/cocinero" className={({ isActive }) => isActive ? 'active' : ''}>
            Cocinero
          </NavLink>
        )}
        {(usuario?.rol === 'chef' || usuario?.rol === 'admin') && (
          <NavLink to="/chef" className={({ isActive }) => isActive ? 'active' : ''}>
            Chef
          </NavLink>
        )}
        {usuario?.rol === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
            Admin
          </NavLink>
        )}
        {esAdmin && (
          // Solo se ve dentro del menu de hamburguesa (en celular)
          <button type="button" className="navbar-tema" onClick={alternarTema}>
            <i
              key={oscuro ? 'sol' : 'luna'}
              className={'fa-solid navbar-tema-icono ' + (oscuro ? 'fa-sun' : 'fa-moon')}
            ></i>
            {oscuro ? 'Modo claro' : 'Modo oscuro'}
          </button>
        )}
        {usuario && (
          <button className="navbar-logout" onClick={handleLogout}>
            Salir ({usuario.nombre})
          </button>
        )}
      </nav>
    </header>
  )
}

export default Navbar