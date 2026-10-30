import { useTema } from '../contexts/ThemeContext.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import '../styles/ThemeToggle.css'

function ThemeToggle() {
  const { oscuro, alternarTema } = useTema()
  const { usuario } = useAuth()

  // El admin, en celular, cambia el modo desde el menu de hamburguesa:
  // para el le ocultamos el boton flotante en pantallas chicas
  const enMenu = usuario?.rol === 'admin'

  return (
    <button
      type="button"
      className={'tema-toggle' + (oscuro ? ' oscuro' : '') + (enMenu ? ' en-menu' : '')}
      onClick={alternarTema}
      aria-label={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={oscuro ? 'Modo claro' : 'Modo oscuro'}
    >
      <i className="fa-solid fa-moon tema-icono tema-luna"></i>
      <i className="fa-solid fa-sun tema-icono tema-sol"></i>
    </button>
  )
}

export default ThemeToggle