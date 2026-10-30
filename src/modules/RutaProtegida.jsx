import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

function RutaProtegida({ children, rolesPermitidos }) {
  const { usuario, cargando } = useAuth()

  if (cargando) return <p>Cargando...</p>
  if (!usuario) return <Navigate to="/login" replace />
  if (!rolesPermitidos.includes(usuario.rol)) return <Navigate to="/login" replace />

  return children
}

export default RutaProtegida