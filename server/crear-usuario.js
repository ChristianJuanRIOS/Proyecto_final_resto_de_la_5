import bcrypt from 'bcryptjs'
import pool from './db.js'

const usuarios = [
  { usuario: 'admin', password: '1234', nombre: 'Administrador', rol: 'admin' },
  { usuario: 'juan', password: '5678', nombre: 'Juan', rol: 'mozo' },
  { usuario: 'maria', password: '9012', nombre: 'Maria', rol: 'cocinero' },
  { usuario: 'carlos', password: '3456', nombre: 'Carlos', rol: 'chef' },
]

for (const u of usuarios) {
  const hash = await bcrypt.hash(u.password, 10)
  try {
    await pool.query(
      'INSERT INTO usuarios (usuario, password_hash, nombre, rol) VALUES (?, ?, ?, ?)',
      [u.usuario, hash, u.nombre, u.rol]
    )
    console.log(`Usuario creado: ${u.usuario} (${u.rol})`)
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log(`Ya existe: ${u.usuario}, se salteo`)
    } else {
      console.error(`Error creando ${u.usuario}:`, error.message)
    }
  }
}

process.exit()