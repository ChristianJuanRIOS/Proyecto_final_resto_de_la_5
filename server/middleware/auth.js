import jwt from 'jsonwebtoken'

const JWT_SECRET = 'cambiar-esto-por-algo-largo-y-random-en-produccion'

export function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticado' })
  }

  const token = authHeader.split(' ')[1]
  try {
    req.usuario = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

export function requiereRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No tenés permiso para esto' })
    }
    next()
  }
}

export { JWT_SECRET }