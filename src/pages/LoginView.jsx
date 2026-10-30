import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { loginRequest } from '../scripts/api.js'
import '../styles/LoginView.css'

function LoginView() {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      const data = await loginRequest(usuario, password)
      login(data.usuario, data.token)

      const rutasPorRol = { mozo: '/', cocinero: '/cocinero', chef: '/chef', admin: '/admin' }
      navigate(rutasPorRol[data.usuario.rol] || '/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>El resto de la 5</h1>
        <p className="login-subtitle">Iniciá sesión para continuar</p>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <i className="fa-solid fa-user"></i>
            <input
              placeholder="Usuario"
              aria-label="Usuario"
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </div>

          <div className="login-field">
            <i className="fa-solid fa-lock"></i>
            <input
              type="password"
              placeholder="Contraseña"
              aria-label="Contraseña"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-button">Entrar</button>
        </form>
      </div>
    </div>
  )
}

export default LoginView