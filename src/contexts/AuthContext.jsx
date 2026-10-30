import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

function leerUsuarioGuardado() {
  try {
    const guardado = localStorage.getItem('usuario')
    return guardado ? JSON.parse(guardado) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerUsuarioGuardado)

  function login(usuarioData, token) {
    localStorage.setItem('token', token)
    localStorage.setItem('usuario', JSON.stringify(usuarioData))
    setUsuario(usuarioData)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando: false }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}