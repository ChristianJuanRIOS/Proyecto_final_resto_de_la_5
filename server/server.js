import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from './db.js'
import { verificarToken, requiereRol, JWT_SECRET } from './middleware/auth.js'
import stockService from './services/stockService.js'
import pagoService from './services/pagoService.js'
import envioService from './services/envioService.js'

const app = express()
app.use(cors())
app.use(express.json())

const PUERTO = 3001

// LOGIN (pública)
app.post('/api/auth/login', async (req, res) => {
  const { usuario, password } = req.body
  if (!usuario || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' })
  }

  try {
    const [[user]] = await pool.query(
      'SELECT * FROM usuarios WHERE usuario = ?',
      [usuario]
    )
    if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })

    const passwordOk = await bcrypt.compare(password, user.password_hash)
    if (!passwordOk) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      token,
      usuario: { id: user.id, nombre: user.nombre, rol: user.rol },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
})

// A partir de acá, todo requiere estar logueado
app.use('/api/mesas', verificarToken)
app.use('/api/menu', verificarToken)
app.use('/api/ordenes', verificarToken)
app.use('/api/insumos', verificarToken)
app.use('/api/pagos', verificarToken)
app.use('/api/delivery', verificarToken)        // ✅ NUEVO (Módulo 3)
app.use('/api/repartidores', verificarToken)    // ✅ NUEVO (Módulo 3)
app.use('/api/envios', verificarToken)          // ✅ NUEVO (Módulo 3)

// HU8: el mozo ve las mesas (mozo o admin)
app.get('/api/mesas', requiereRol('mozo', 'admin'), async (req, res) => {
  try {
    const [mesas] = await pool.query('SELECT * FROM mesas ORDER BY numero')
    res.json(mesas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener las mesas' })
  }
})

// El mozo libera la mesa después de cobrar (mozo o admin)
app.patch('/api/mesas/:id/liberar', requiereRol('mozo', 'admin'), async (req, res) => {
  try {
    const [[mesa]] = await pool.query('SELECT id FROM mesas WHERE id = ?', [req.params.id])
    if (!mesa) return res.status(404).json({ error: 'La mesa no existe' })

    await pool.query("UPDATE mesas SET estado = 'libre' WHERE id = ?", [req.params.id])
    const [[mesaActualizada]] = await pool.query('SELECT * FROM mesas WHERE id = ?', [req.params.id])
    res.json(mesaActualizada)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al liberar la mesa' })
  }
})

// ---------- ABM de mesas (solo admin) ----------
function validarMesa(body) {
  const numero = Number(body.numero)
  const capacidad = Number(body.capacidad)

  if (!Number.isInteger(numero) || numero < 1 || numero > 999) {
    return { error: 'El número de mesa tiene que ser un entero entre 1 y 999' }
  }
  if (!Number.isInteger(capacidad) || capacidad < 1 || capacidad > 30) {
    return { error: 'La capacidad tiene que ser un entero entre 1 y 30' }
  }
  return { mesa: { numero, capacidad } }
}

app.post('/api/mesas', requiereRol('admin'), async (req, res) => {
  const { error, mesa } = validarMesa(req.body)
  if (error) return res.status(400).json({ error })

  try {
    const [[repetida]] = await pool.query('SELECT id FROM mesas WHERE numero = ?', [mesa.numero])
    if (repetida) return res.status(409).json({ error: `Ya existe la mesa ${mesa.numero}` })

    const [resultado] = await pool.query(
      "INSERT INTO mesas (numero, capacidad, estado) VALUES (?, ?, 'libre')",
      [mesa.numero, mesa.capacidad]
    )
    const [[creada]] = await pool.query('SELECT * FROM mesas WHERE id = ?', [resultado.insertId])
    res.status(201).json(creada)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al agregar la mesa' })
  }
})

app.put('/api/mesas/:id', requiereRol('admin'), async (req, res) => {
  const { error, mesa } = validarMesa(req.body)
  if (error) return res.status(400).json({ error })

  try {
    const [[existente]] = await pool.query('SELECT id FROM mesas WHERE id = ?', [req.params.id])
    if (!existente) return res.status(404).json({ error: 'La mesa no existe' })

    const [[repetida]] = await pool.query(
      'SELECT id FROM mesas WHERE numero = ? AND id <> ?',
      [mesa.numero, req.params.id]
    )
    if (repetida) return res.status(409).json({ error: `Ya existe la mesa ${mesa.numero}` })

    await pool.query(
      'UPDATE mesas SET numero = ?, capacidad = ? WHERE id = ?',
      [mesa.numero, mesa.capacidad, req.params.id]
    )
    const [[actualizada]] = await pool.query('SELECT * FROM mesas WHERE id = ?', [req.params.id])
    res.json(actualizada)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al editar la mesa' })
  }
})

// Mover una mesa en el plano (x e y son porcentajes del plano, de 0 a 100)
app.patch('/api/mesas/:id/posicion', requiereRol('admin'), async (req, res) => {
  const x = Number(req.body.x)
  const y = Number(req.body.y)
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) {
    return res.status(400).json({ error: 'La posición tiene que estar entre 0 y 100' })
  }

  try {
    const [[existente]] = await pool.query('SELECT id FROM mesas WHERE id = ?', [req.params.id])
    if (!existente) return res.status(404).json({ error: 'La mesa no existe' })

    await pool.query(
      'UPDATE mesas SET pos_x = ?, pos_y = ? WHERE id = ?',
      [x.toFixed(2), y.toFixed(2), req.params.id]
    )
    const [[actualizada]] = await pool.query('SELECT * FROM mesas WHERE id = ?', [req.params.id])
    res.json(actualizada)
  } catch (error) {
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({
        error: 'Falta agregar las columnas pos_x y pos_y a la tabla mesas (ver instrucciones)',
      })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al mover la mesa' })
  }
})

app.delete('/api/mesas/:id', requiereRol('admin'), async (req, res) => {
  try {
    const [[mesa]] = await pool.query('SELECT id, estado FROM mesas WHERE id = ?', [req.params.id])
    if (!mesa) return res.status(404).json({ error: 'La mesa no existe' })
    if (mesa.estado === 'ocupada') {
      return res.status(409).json({ error: 'No se puede borrar una mesa ocupada' })
    }

    await pool.query('DELETE FROM mesas WHERE id = ?', [req.params.id])
    res.json({ ok: true, id: Number(req.params.id) })
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'No se puede borrar: la mesa ya tiene pedidos registrados' })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al borrar la mesa' })
  }
})

// HU9: el mozo ve el menu (mozo o admin)
app.get('/api/menu', requiereRol('mozo', 'admin'), async (req, res) => {
  try {
    const [menu] = await pool.query('SELECT * FROM menu_items')
    res.json(menu)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener el menu' })
  }
})

// ---------- ABM de platos del menu (solo admin) ----------
const CATEGORIAS_MENU = ['entrada', 'principal', 'postre', 'bebida']

function validarPlato(body) {
  const nombre = String(body.nombre ?? '').trim()
  const categoria = String(body.categoria ?? '').trim().toLowerCase()
  const precio = Number(body.precio)

  if (!nombre) return { error: 'El nombre es obligatorio' }
  if (nombre.length > 100) {
    return { error: 'El nombre es demasiado largo (máximo 100 caracteres)' }
  }
  if (!CATEGORIAS_MENU.includes(categoria)) {
    return { error: `La categoría tiene que ser una de: ${CATEGORIAS_MENU.join(', ')}` }
  }
  if (!Number.isFinite(precio) || precio <= 0) {
    return { error: 'El precio tiene que ser un número mayor a 0' }
  }
  return { plato: { nombre, categoria, precio } }
}

app.post('/api/menu', requiereRol('admin'), async (req, res) => {
  const { error, plato } = validarPlato(req.body)
  if (error) return res.status(400).json({ error })

  try {
    const [resultado] = await pool.query(
      'INSERT INTO menu_items (nombre, categoria, precio) VALUES (?, ?, ?)',
      [plato.nombre, plato.categoria, plato.precio.toFixed(2)]
    )
    const [[creado]] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [resultado.insertId])
    res.status(201).json(creado)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al agregar el plato' })
  }
})

app.put('/api/menu/:id', requiereRol('admin'), async (req, res) => {
  const { error, plato } = validarPlato(req.body)
  if (error) return res.status(400).json({ error })

  try {
    const [[existente]] = await pool.query('SELECT id FROM menu_items WHERE id = ?', [req.params.id])
    if (!existente) return res.status(404).json({ error: 'El plato no existe' })

    await pool.query(
      'UPDATE menu_items SET nombre = ?, categoria = ?, precio = ? WHERE id = ?',
      [plato.nombre, plato.categoria, plato.precio.toFixed(2), req.params.id]
    )
    const [[actualizado]] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [req.params.id])
    res.json(actualizado)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al editar el plato' })
  }
})

app.delete('/api/menu/:id', requiereRol('admin'), async (req, res) => {
  try {
    const [[existente]] = await pool.query('SELECT id FROM menu_items WHERE id = ?', [req.params.id])
    if (!existente) return res.status(404).json({ error: 'El plato no existe' })

    await pool.query('DELETE FROM menu_items WHERE id = ?', [req.params.id])
    res.json({ ok: true, id: Number(req.params.id) })
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'No se puede borrar: este plato ya se usó en pedidos' })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al borrar el plato' })
  }
})

// ---------- STOCK: asociar insumos a un plato (receta) ----------
app.put('/api/menu/:id/insumos', requiereRol('admin'), async (req, res) => {
  const { insumos } = req.body
  if (!Array.isArray(insumos) || insumos.length === 0) {
    return res.status(400).json({ error: 'Faltan insumos' })
  }
  try {
    await pool.query('DELETE FROM plato_insumos WHERE plato_id = ?', [req.params.id])
    for (const ins of insumos) {
      await pool.query(
        `INSERT INTO plato_insumos (plato_id, insumo_id, cantidad_necesaria) VALUES (?, ?, ?)`,
        [req.params.id, ins.insumo_id, ins.cantidad_necesaria]
      )
    }
    const [receta] = await pool.query(
      `SELECT i.id, i.nombre, i.unidad, pi.cantidad_necesaria
       FROM plato_insumos pi
       JOIN insumos i ON i.id = pi.insumo_id
       WHERE pi.plato_id = ?`,
      [req.params.id]
    )
    res.json({ plato_id: Number(req.params.id), insumos: receta })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al asignar insumos al plato' })
  }
})

// ---------- CREAR ORDEN (mesa) ----------
// La orden arranca en 'pendiente' porque requiere pago aprobado antes de ir a cocina.
app.post('/api/ordenes', requiereRol('mozo', 'admin'), async (req, res) => {
  const { mesaId, mozoNombre, items } = req.body

  if (!mesaId || !mozoNombre || !items?.length) {
    return res.status(400).json({ error: 'Faltan datos de la orden' })
  }

  // Verificación de stock
  const verificacion = await stockService.verificarDisponibilidad(items)
  if (!verificacion.disponible) {
    return res.status(409).json({
      error: 'Stock insuficiente para alguno de los platos',
      faltantes: verificacion.faltantes,
    })
  }

  const conexion = await pool.getConnection()
  try {
    await conexion.beginTransaction()

    const [resultadoOrden] = await conexion.query(
      'INSERT INTO ordenes (mesa_id, mozo_nombre, estado) VALUES (?, ?, ?)',
      [mesaId, mozoNombre, 'pendiente']
    )
    const ordenId = resultadoOrden.insertId

    for (const item of items) {
      await conexion.query(
        'INSERT INTO orden_items (orden_id, menu_item_id, nombre, precio, cantidad) VALUES (?, ?, ?, ?, ?)',
        [ordenId, item.menu_item_id, item.nombre, item.precio, item.cantidad]
      )
    }

    const montoTotal = items.reduce(
      (suma, item) => suma + Number(item.precio) * Number(item.cantidad),
      0
    )

    await stockService.reservar(items, ordenId, conexion)
    await conexion.query("UPDATE mesas SET estado = 'ocupada' WHERE id = ?", [mesaId])

    await conexion.commit()
    res.status(201).json({
      ...(await obtenerOrdenPorId(ordenId)),
      monto_total: Number(montoTotal.toFixed(2)),
    })
  } catch (error) {
    await conexion.rollback()
    console.error(error)
    res.status(500).json({ error: 'Error al crear la orden' })
  } finally {
    conexion.release()
  }
})

// ---------- CANCELAR ORDEN ----------
app.patch('/api/ordenes/:id/cancelar', requiereRol('mozo', 'admin'), async (req, res) => {
  const conexion = await pool.getConnection()
  try {
    await conexion.beginTransaction()

    const [[orden]] = await conexion.query(
      'SELECT id, estado, mesa_id FROM ordenes WHERE id = ?',
      [req.params.id]
    )
    if (!orden) {
      await conexion.rollback()
      return res.status(404).json({ error: 'La orden no existe' })
    }
    if (!['pendiente', 'en_cocina'].includes(orden.estado)) {
      await conexion.rollback()
      return res.status(409).json({ error: `No se puede cancelar una orden en estado '${orden.estado}'` })
    }

    await stockService.liberar(orden.id, conexion)
    await conexion.query("UPDATE ordenes SET estado = 'cancelado' WHERE id = ?", [orden.id])

    if (orden.mesa_id) {
      await conexion.query("UPDATE mesas SET estado = 'libre' WHERE id = ?", [orden.mesa_id])
    }

    await conexion.commit()
    res.json(await obtenerOrdenPorId(orden.id))
  } catch (error) {
    await conexion.rollback()
    console.error(error)
    res.status(500).json({ error: 'Error al cancelar la orden' })
  } finally {
    conexion.release()
  }
})

// ---------- ENVIAR A COCINA ----------
app.patch('/api/ordenes/:id/enviar-a-cocina', requiereRol('mozo', 'admin'), async (req, res) => {
  try {
    const [[orden]] = await pool.query('SELECT id, estado FROM ordenes WHERE id = ?', [req.params.id])
    if (!orden) return res.status(404).json({ error: 'La orden no existe' })

    if (orden.estado !== 'pendiente') {
      return res.status(409).json({ error: `No se puede enviar a cocina: la orden está '${orden.estado}'` })
    }

    const [[pago]] = await pool.query(
      "SELECT id FROM pagos WHERE orden_id = ? AND estado = 'aprobado' LIMIT 1",
      [req.params.id]
    )
    if (!pago) {
      return res.status(402).json({
        error: 'La orden no tiene pago aprobado. Procesá el pago antes de enviar a cocina.',
      })
    }

    await pool.query(
      "UPDATE ordenes SET estado = 'en_cocina', enviado_cocina_en = NOW() WHERE id = ?",
      [req.params.id]
    )
    res.json(await obtenerOrdenPorId(req.params.id))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al enviar la orden a cocina' })
  }
})

// ---------- COCINA: ver órdenes en cocina ----------
app.get('/api/ordenes/cocina', requiereRol('cocinero', 'chef', 'admin'), async (req, res) => {
  try {
    const [ordenes] = await pool.query(
      `SELECT o.*, m.numero AS mesa_numero
       FROM ordenes o
       LEFT JOIN mesas m ON m.id = o.mesa_id
       WHERE o.estado = 'en_cocina'
       ORDER BY o.enviado_cocina_en ASC`
    )

    const ordenesConItems = await Promise.all(
      ordenes.map(async (orden) => ({
        ...orden,
        items: await obtenerItemsDeOrden(orden.id),
      }))
    )

    res.json(ordenesConItems)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener las ordenes de cocina' })
  }
})

// ---------- Pedidos listos para servir ----------
app.get('/api/ordenes/listas', requiereRol('mozo', 'admin'), async (req, res) => {
  try {
    const [ordenes] = await pool.query(
      `SELECT o.*, m.numero AS mesa_numero
       FROM ordenes o
       LEFT JOIN mesas m ON m.id = o.mesa_id
       WHERE o.estado = 'listo' AND o.mesa_id IS NOT NULL
       ORDER BY o.enviado_cocina_en ASC`
    )

    const ordenesConItems = await Promise.all(
      ordenes.map(async (orden) => ({
        ...orden,
        items: await obtenerItemsDeOrden(orden.id),
      }))
    )

    res.json(ordenesConItems)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener los pedidos listos' })
  }
})

// Mozo marca un pedido como entregado (mesa)
app.patch('/api/ordenes/:id/entregar', requiereRol('mozo', 'admin'), async (req, res) => {
  try {
    const [[orden]] = await pool.query(
      'SELECT id, estado, mozo_nombre FROM ordenes WHERE id = ?',
      [req.params.id]
    )
    if (!orden) return res.status(404).json({ error: 'La orden no existe' })
    if (orden.estado !== 'listo') {
      return res.status(409).json({ error: 'La orden no está lista para entregar' })
    }

    await pool.query("UPDATE ordenes SET estado = 'entregado' WHERE id = ?", [req.params.id])
    res.json(await obtenerOrdenPorId(req.params.id))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al entregar la orden' })
  }
})

// Chef marca una orden como lista
app.patch('/api/ordenes/:id/marcar-listo', requiereRol('chef', 'admin'), async (req, res) => {
  try {
    const [[orden]] = await pool.query('SELECT id, estado FROM ordenes WHERE id = ?', [req.params.id])
    if (!orden) return res.status(404).json({ error: 'La orden no existe' })
    if (orden.estado !== 'en_cocina') {
      return res.status(409).json({ error: 'La orden ya no está en cocina' })
    }

    await pool.query("UPDATE ordenes SET estado = 'listo' WHERE id = ?", [req.params.id])
    res.json(await obtenerOrdenPorId(req.params.id))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al marcar la orden como lista' })
  }
})

async function obtenerItemsDeOrden(ordenId) {
  const [items] = await pool.query(
    'SELECT menu_item_id, nombre, precio, cantidad FROM orden_items WHERE orden_id = ?',
    [ordenId]
  )
  return items
}

async function obtenerOrdenPorId(ordenId) {
  const [[orden]] = await pool.query(
    `SELECT o.*, m.numero AS mesa_numero
     FROM ordenes o
     LEFT JOIN mesas m ON m.id = o.mesa_id
     WHERE o.id = ?`,
    [ordenId]
  )
  return { ...orden, items: await obtenerItemsDeOrden(ordenId) }
}

// ---------- ABM DE INSUMOS (solo admin) ----------

app.get('/api/insumos', requiereRol('admin'), async (req, res) => {
  try {
    const [insumos] = await pool.query(
      `SELECT id, nombre, unidad, stock_actual, stock_minimo,
              (stock_actual <= stock_minimo) AS bajo_minimo
       FROM insumos ORDER BY nombre`
    )
    res.json(insumos)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener insumos' })
  }
})

app.post('/api/insumos', requiereRol('admin'), async (req, res) => {
  const { nombre, unidad, stock_actual = 0, stock_minimo = 0 } = req.body
  if (!nombre || !unidad) {
    return res.status(400).json({ error: 'Faltan datos del insumo' })
  }
  try {
    const [resultado] = await pool.query(
      'INSERT INTO insumos (nombre, unidad, stock_actual, stock_minimo) VALUES (?, ?, ?, ?)',
      [nombre, unidad, stock_actual, stock_minimo]
    )
    const [[creado]] = await pool.query('SELECT * FROM insumos WHERE id = ?', [resultado.insertId])
    res.status(201).json(creado)
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un insumo con ese nombre' })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al crear el insumo' })
  }
})

app.put('/api/insumos/:id', requiereRol('admin'), async (req, res) => {
  const { nombre, unidad, stock_minimo } = req.body
  if (!nombre || !unidad) {
    return res.status(400).json({ error: 'Faltan datos' })
  }
  try {
    await pool.query(
      'UPDATE insumos SET nombre = ?, unidad = ?, stock_minimo = ? WHERE id = ?',
      [nombre, unidad, stock_minimo, req.params.id]
    )
    const [[actualizado]] = await pool.query('SELECT * FROM insumos WHERE id = ?', [req.params.id])
    res.json(actualizado)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al editar el insumo' })
  }
})

app.patch('/api/insumos/:id/ajustar', requiereRol('admin'), async (req, res) => {
  const { cantidad, motivo } = req.body
  if (!Number.isFinite(cantidad) || cantidad === 0) {
    return res.status(400).json({ error: 'La cantidad debe ser un número distinto de 0' })
  }
  if (!['compra', 'merma', 'ajuste'].includes(motivo)) {
    return res.status(400).json({ error: 'Motivo inválido (compra | merma | ajuste)' })
  }
  try {
    await pool.query(
      'UPDATE insumos SET stock_actual = stock_actual + ? WHERE id = ?',
      [cantidad, req.params.id]
    )
    await pool.query(
      `INSERT INTO movimientos_stock (insumo_id, cantidad, motivo) VALUES (?, ?, ?)`,
      [req.params.id, cantidad, motivo]
    )
    const [[actualizado]] = await pool.query('SELECT * FROM insumos WHERE id = ?', [req.params.id])
    res.json(actualizado)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al ajustar el stock' })
  }
})

app.post('/api/insumos/verificar', requiereRol('mozo', 'admin'), async (req, res) => {
  const { items } = req.body
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Faltan items' })
  }
  const verificacion = await stockService.verificarDisponibilidad(items)
  res.json(verificacion)
})

// ---------- PAGOS (Módulo 2) ----------

// Listar todos los pagos (solo admin) — admite filtro por estado en query param
app.get('/api/pagos', requiereRol('admin'), async (req, res) => {
  const { estado } = req.query
  try {
    let query = `
      SELECT p.*, o.mesa_id, m.numero AS mesa_numero, o.mozo_nombre
      FROM pagos p
      JOIN ordenes o ON o.id = p.orden_id
      LEFT JOIN mesas m ON m.id = o.mesa_id
    `
    const params = []
    if (estado && ['pendiente', 'aprobado', 'rechazado', 'reembolsado'].includes(estado)) {
      query += ' WHERE p.estado = ?'
      params.push(estado)
    }
    query += ' ORDER BY p.creado_en DESC'

    const [pagos] = await pool.query(query, params)
    res.json(pagos)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener los pagos' })
  }
})

// Procesar un pago para una orden
app.post('/api/pagos', requiereRol('mozo', 'admin'), async (req, res) => {
  const { orden_id, pasarela, detalle } = req.body

  if (!orden_id || !pasarela) {
    return res.status(400).json({ error: 'Faltan datos del pago (orden_id y pasarela son obligatorios)' })
  }

  const [[orden]] = await pool.query('SELECT id, estado FROM ordenes WHERE id = ?', [orden_id])
  if (!orden) return res.status(404).json({ error: 'La orden no existe' })
  if (orden.estado !== 'pendiente') {
    return res.status(409).json({ error: `La orden ya está en estado '${orden.estado}', no se puede procesar un nuevo pago` })
  }

  const [items] = await pool.query(
    'SELECT precio, cantidad FROM orden_items WHERE orden_id = ?',
    [orden_id]
  )
  const monto = items.reduce(
    (suma, it) => suma + Number(it.precio) * Number(it.cantidad),
    0
  )

  let resultado
  try {
    resultado = await pagoService.procesar({
      orden_id,
      monto,
      pasarela,
      detalle,
    })
  } catch (error) {
    console.error('Error en pagoService.procesar:', error)
    return res.status(400).json({ error: error.message })
  }

  const conexion = await pool.getConnection()
  try {
    await conexion.beginTransaction()

    const [insertPago] = await conexion.query(
      `INSERT INTO pagos (orden_id, monto, pasarela, estado, referencia_externa, detalle)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        orden_id,
        Number(monto.toFixed(2)),
        pasarela,
        resultado.estado,
        resultado.referencia_externa,
        JSON.stringify(resultado.detalle),
      ]
    )
    const pagoId = insertPago.insertId

    if (resultado.estado === 'aprobado') {
      await conexion.query(
        "UPDATE ordenes SET estado = 'en_cocina', enviado_cocina_en = NOW() WHERE id = ?",
        [orden_id]
      )
    }

    await conexion.commit()

    const [[pagoCreado]] = await pool.query('SELECT * FROM pagos WHERE id = ?', [pagoId])
    res.status(201).json({
      pago: pagoCreado,
      orden: await obtenerOrdenPorId(orden_id),
    })
  } catch (error) {
    await conexion.rollback()
    console.error(error)
    res.status(500).json({ error: 'Error al guardar el pago' })
  } finally {
    conexion.release()
  }
})

// Ver los pagos de una orden
app.get('/api/pagos/orden/:ordenId', requiereRol('mozo', 'admin'), async (req, res) => {
  try {
    const [pagos] = await pool.query(
      'SELECT * FROM pagos WHERE orden_id = ? ORDER BY creado_en DESC',
      [req.params.ordenId]
    )
    res.json(pagos)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener los pagos' })
  }
})

// Reembolsar un pago (solo admin)
app.patch('/api/pagos/:id/reembolsar', requiereRol('admin'), async (req, res) => {
  const conexion = await pool.getConnection()
  try {
    await conexion.beginTransaction()

    const [[pago]] = await conexion.query(
      'SELECT id, orden_id, pasarela, estado, referencia_externa, detalle FROM pagos WHERE id = ?',
      [req.params.id]
    )
    if (!pago) {
      await conexion.rollback()
      return res.status(404).json({ error: 'El pago no existe' })
    }
    if (pago.estado !== 'aprobado') {
      await conexion.rollback()
      return res.status(409).json({ error: `Solo se pueden reembolsar pagos aprobados (este está '${pago.estado}')` })
    }

    const resultado = await pagoService.reembolsar(pago)

    await conexion.query(
      "UPDATE pagos SET estado = 'reembolsado', detalle = ? WHERE id = ?",
      [JSON.stringify({ ...JSON.parse(pago.detalle || '{}'), ...resultado.detalle }), pago.id]
    )

    const [[orden]] = await conexion.query(
      'SELECT id, estado, mesa_id FROM ordenes WHERE id = ?',
      [pago.orden_id]
    )
    if (orden && ['pendiente', 'en_cocina'].includes(orden.estado)) {
      await stockService.liberar(orden.id, conexion)
      await conexion.query("UPDATE ordenes SET estado = 'cancelado' WHERE id = ?", [orden.id])
      if (orden.mesa_id) {
        await conexion.query("UPDATE mesas SET estado = 'libre' WHERE id = ?", [orden.mesa_id])
      }
    }

    await conexion.commit()
    const [[pagoActualizado]] = await pool.query('SELECT * FROM pagos WHERE id = ?', [pago.id])
    res.json({
      pago: pagoActualizado,
      orden: orden ? await obtenerOrdenPorId(orden.id) : null,
    })
  } catch (error) {
    await conexion.rollback()
    console.error(error)
    res.status(500).json({ error: 'Error al reembolsar el pago' })
  } finally {
    conexion.release()
  }
})

// Aprobar manualmente una transferencia pendiente (solo admin)
app.patch('/api/pagos/:id/aprobar-transferencia', requiereRol('admin'), async (req, res) => {
  const conexion = await pool.getConnection()
  try {
    await conexion.beginTransaction()

    const [[pago]] = await conexion.query(
      'SELECT id, orden_id, pasarela, estado FROM pagos WHERE id = ?',
      [req.params.id]
    )
    if (!pago) {
      await conexion.rollback()
      return res.status(404).json({ error: 'El pago no existe' })
    }
    if (pago.pasarela !== 'transferencia') {
      await conexion.rollback()
      return res.status(409).json({ error: 'Este endpoint solo aprueba transferencias' })
    }
    if (pago.estado !== 'pendiente') {
      await conexion.rollback()
      return res.status(409).json({ error: `La transferencia ya está '${pago.estado}'` })
    }

    await conexion.query(
      "UPDATE pagos SET estado = 'aprobado' WHERE id = ?",
      [pago.id]
    )

    const [[orden]] = await conexion.query(
      'SELECT id, estado FROM ordenes WHERE id = ?',
      [pago.orden_id]
    )
    if (orden && orden.estado === 'pendiente') {
      await conexion.query(
        "UPDATE ordenes SET estado = 'en_cocina', enviado_cocina_en = NOW() WHERE id = ?",
        [orden.id]
      )
    }

    await conexion.commit()
    const [[pagoActualizado]] = await pool.query('SELECT * FROM pagos WHERE id = ?', [pago.id])
    res.json({
      pago: pagoActualizado,
      orden: orden ? await obtenerOrdenPorId(orden.id) : null,
    })
  } catch (error) {
    await conexion.rollback()
    console.error(error)
    res.status(500).json({ error: 'Error al aprobar la transferencia' })
  } finally {
    conexion.release()
  }
})

// ============================================
// MÓDULO 3: DELIVERY + ENVÍOS + REPARTIDORES
// ============================================

// ---------- Cálculo de envío (Strategy) ----------

app.post('/api/envios/calcular', requiereRol('mozo', 'admin'), (req, res) => {
  const { modalidad, subtotal, distancia_km } = req.body
  if (!modalidad) {
    return res.status(400).json({ error: 'Falta la modalidad de envío' })
  }
  try {
    const resultado = envioService.calcular(modalidad, Number(subtotal) || 0, distancia_km)
    res.json(resultado)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.get('/api/envios/modalidades', requiereRol('mozo', 'admin'), (req, res) => {
  res.json(envioService.modalidadesDisponibles())
})


// ---------- Pedidos de delivery ----------

// Crear pedido de delivery
app.post('/api/delivery', requiereRol('mozo', 'admin'), async (req, res) => {
  const {
    mozoNombre,
    items,
    cliente_nombre,
    direccion,
    observaciones,
    telefono,
    modalidad_envio,
    distancia_km,
  } = req.body

  if (!mozoNombre || !items?.length || !cliente_nombre || !direccion || !modalidad_envio) {
    return res.status(400).json({
      error: 'Faltan datos del pedido (mozoNombre, items, cliente_nombre, direccion y modalidad_envio son obligatorios)',
    })
  }

  // 1) Verificar stock
  const verificacion = await stockService.verificarDisponibilidad(items)
  if (!verificacion.disponible) {
    return res.status(409).json({
      error: 'Stock insuficiente para alguno de los platos',
      faltantes: verificacion.faltantes,
    })
  }

  // 2) Calcular costo de envío
  let costoEnvio
  try {
    const resultado = envioService.calcular(modalidad_envio, 0, distancia_km)
    costoEnvio = resultado.costo
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }

  // 3) Calcular monto de items
  const montoItems = items.reduce(
    (suma, item) => suma + Number(item.precio) * Number(item.cantidad),
    0
  )

  // 4) Crear orden + registro de delivery en transacción
  const conexion = await pool.getConnection()
  try {
    await conexion.beginTransaction()

    // Crear la orden con mesa_id=NULL
    const [resultadoOrden] = await conexion.query(
      'INSERT INTO ordenes (mesa_id, mozo_nombre, estado) VALUES (NULL, ?, ?)',
      [mozoNombre, 'pendiente']
    )
    const ordenId = resultadoOrden.insertId

    // Insertar items
    for (const item of items) {
      await conexion.query(
        'INSERT INTO orden_items (orden_id, menu_item_id, nombre, precio, cantidad) VALUES (?, ?, ?, ?, ?)',
        [ordenId, item.menu_item_id, item.nombre, item.precio, item.cantidad]
      )
    }

    // Crear el registro de delivery
    const [resultadoDelivery] = await conexion.query(
      `INSERT INTO pedidos_delivery
        (orden_id, cliente_nombre, direccion, observaciones, telefono, modalidad_envio, costo_envio, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'en_preparacion')`,
      [ordenId, cliente_nombre, direccion, observaciones || null, telefono || null, modalidad_envio, costoEnvio]
    )
    const deliveryId = resultadoDelivery.insertId

    // Reservar stock
    await stockService.reservar(items, ordenId, conexion)

    await conexion.commit()

    const [[deliveryCreado]] = await pool.query(
      `SELECT pd.*, o.estado AS orden_estado, o.mozo_nombre
       FROM pedidos_delivery pd
       JOIN ordenes o ON o.id = pd.orden_id
       WHERE pd.id = ?`,
      [deliveryId]
    )

    res.status(201).json({
      orden: await obtenerOrdenPorId(ordenId),
      delivery: deliveryCreado,
      monto_items: Number(montoItems.toFixed(2)),
      costo_envio: Number(costoEnvio.toFixed(2)),
      monto_total: Number((montoItems + costoEnvio).toFixed(2)),
    })
  } catch (error) {
    await conexion.rollback()
    console.error(error)
    res.status(500).json({ error: 'Error al crear el pedido de delivery' })
  } finally {
    conexion.release()
  }
})

// Listar pedidos de delivery (con filtros opcionales por estado)
app.get('/api/delivery', requiereRol('mozo', 'admin'), async (req, res) => {
  const { estado } = req.query
  try {
    let query = `
      SELECT pd.*, o.estado AS orden_estado, o.mozo_nombre,
             r.nombre AS repartidor_nombre, r.contacto AS repartidor_contacto
      FROM pedidos_delivery pd
      JOIN ordenes o ON o.id = pd.orden_id
      LEFT JOIN repartidores r ON r.id = pd.repartidor_id
    `
    const params = []
    if (estado && ['en_preparacion', 'en_camino', 'entregado', 'cancelado'].includes(estado)) {
      query += ' WHERE pd.estado = ?'
      params.push(estado)
    }
    query += ' ORDER BY pd.creado_en DESC'

    const [pedidos] = await pool.query(query, params)

    const pedidosConItems = await Promise.all(
      pedidos.map(async (p) => ({
        ...p,
        items: await obtenerItemsDeOrden(p.orden_id),
      }))
    )

    res.json(pedidosConItems)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener los pedidos de delivery' })
  }
})

// Ver un pedido de delivery específico
app.get('/api/delivery/:id', requiereRol('mozo', 'admin'), async (req, res) => {
  try {
    const [[pedido]] = await pool.query(
      `SELECT pd.*, o.estado AS orden_estado, o.mozo_nombre,
             r.nombre AS repartidor_nombre, r.contacto AS repartidor_contacto
       FROM pedidos_delivery pd
       JOIN ordenes o ON o.id = pd.orden_id
       LEFT JOIN repartidores r ON r.id = pd.repartidor_id
       WHERE pd.id = ?`,
      [req.params.id]
    )
    if (!pedido) return res.status(404).json({ error: 'El pedido no existe' })

    const items = await obtenerItemsDeOrden(pedido.orden_id)
    res.json({ ...pedido, items })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener el pedido' })
  }
})

// Asignar repartidor (solo si la orden está 'listo' — cocina terminó)
app.patch('/api/delivery/:id/asignar-repartidor', requiereRol('mozo', 'admin'), async (req, res) => {
  const { repartidor_id } = req.body
  if (!repartidor_id) {
    return res.status(400).json({ error: 'Falta el repartidor_id' })
  }

  const conexion = await pool.getConnection()
  try {
    await conexion.beginTransaction()

    const [[pedido]] = await conexion.query(
      `SELECT pd.id, pd.estado, o.estado AS orden_estado
       FROM pedidos_delivery pd
       JOIN ordenes o ON o.id = pd.orden_id
       WHERE pd.id = ?`,
      [req.params.id]
    )
    if (!pedido) {
      await conexion.rollback()
      return res.status(404).json({ error: 'El pedido no existe' })
    }
    if (pedido.orden_estado !== 'listo') {
      await conexion.rollback()
      return res.status(409).json({
        error: `La orden todavía no está lista (estado: '${pedido.orden_estado}'). Esperá a que el chef la marque como lista.`,
      })
    }

    const [[repartidor]] = await conexion.query(
      'SELECT id, nombre, activo FROM repartidores WHERE id = ?',
      [repartidor_id]
    )
    if (!repartidor) {
      await conexion.rollback()
      return res.status(404).json({ error: 'El repartidor no existe' })
    }
    if (!repartidor.activo) {
      await conexion.rollback()
      return res.status(409).json({ error: 'El repartidor no está activo' })
    }

    await conexion.query(
      `UPDATE pedidos_delivery SET repartidor_id = ?, estado = 'en_camino' WHERE id = ?`,
      [repartidor_id, req.params.id]
    )

    await conexion.commit()

    const [[actualizado]] = await pool.query(
      `SELECT pd.*, o.estado AS orden_estado, o.mozo_nombre,
             r.nombre AS repartidor_nombre, r.contacto AS repartidor_contacto
       FROM pedidos_delivery pd
       JOIN ordenes o ON o.id = pd.orden_id
       LEFT JOIN repartidores r ON r.id = pd.repartidor_id
       WHERE pd.id = ?`,
      [req.params.id]
    )
    res.json(actualizado)
  } catch (error) {
    await conexion.rollback()
    console.error(error)
    res.status(500).json({ error: 'Error al asignar el repartidor' })
  } finally {
    conexion.release()
  }
})

// Marcar un pedido de delivery como entregado
app.patch('/api/delivery/:id/entregar', requiereRol('mozo', 'admin'), async (req, res) => {
  const conexion = await pool.getConnection()
  try {
    await conexion.beginTransaction()

    const [[pedido]] = await conexion.query(
      `SELECT pd.id, pd.estado, pd.orden_id
       FROM pedidos_delivery pd
       WHERE pd.id = ?`,
      [req.params.id]
    )
    if (!pedido) {
      await conexion.rollback()
      return res.status(404).json({ error: 'El pedido no existe' })
    }
    if (pedido.estado !== 'en_camino') {
      await conexion.rollback()
      return res.status(409).json({ error: `El pedido no está en camino (estado: '${pedido.estado}')` })
    }

    await conexion.query(
      "UPDATE pedidos_delivery SET estado = 'entregado' WHERE id = ?",
      [req.params.id]
    )
    await conexion.query(
      "UPDATE ordenes SET estado = 'entregado' WHERE id = ?",
      [pedido.orden_id]
    )

    await conexion.commit()

    const [[actualizado]] = await pool.query(
      `SELECT pd.*, o.estado AS orden_estado, o.mozo_nombre,
             r.nombre AS repartidor_nombre
       FROM pedidos_delivery pd
       JOIN ordenes o ON o.id = pd.orden_id
       LEFT JOIN repartidores r ON r.id = pd.repartidor_id
       WHERE pd.id = ?`,
      [req.params.id]
    )
    res.json(actualizado)
  } catch (error) {
    await conexion.rollback()
    console.error(error)
    res.status(500).json({ error: 'Error al marcar como entregado' })
  } finally {
    conexion.release()
  }
})


// ---------- Repartidores (ABM solo admin para crear/editar, mozo/admin para listar) ----------

app.get('/api/repartidores', requiereRol('mozo', 'admin'), async (req, res) => {
  try {
    const [repartidores] = await pool.query(
      'SELECT id, nombre, contacto, activo, creado_en FROM repartidores ORDER BY nombre'
    )
    res.json(repartidores)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener los repartidores' })
  }
})

app.post('/api/repartidores', requiereRol('admin'), async (req, res) => {
  const { nombre, contacto } = req.body
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' })
  }
  try {
    const [resultado] = await pool.query(
      'INSERT INTO repartidores (nombre, contacto) VALUES (?, ?)',
      [nombre, contacto || null]
    )
    const [[creado]] = await pool.query('SELECT * FROM repartidores WHERE id = ?', [resultado.insertId])
    res.status(201).json(creado)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear el repartidor' })
  }
})

app.put('/api/repartidores/:id', requiereRol('admin'), async (req, res) => {
  const { nombre, contacto, activo } = req.body
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' })
  }
  try {
    await pool.query(
      'UPDATE repartidores SET nombre = ?, contacto = ?, activo = ? WHERE id = ?',
      [nombre, contacto ?? null, activo ?? true, req.params.id]
    )
    const [[actualizado]] = await pool.query('SELECT * FROM repartidores WHERE id = ?', [req.params.id])
    res.json(actualizado)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al editar el repartidor' })
  }
})

app.delete('/api/repartidores/:id', requiereRol('admin'), async (req, res) => {
  try {
    const [[repartidor]] = await pool.query('SELECT id FROM repartidores WHERE id = ?', [req.params.id])
    if (!repartidor) return res.status(404).json({ error: 'El repartidor no existe' })

    await pool.query('DELETE FROM repartidores WHERE id = ?', [req.params.id])
    res.json({ ok: true, id: Number(req.params.id) })
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'No se puede borrar: el repartidor ya tiene pedidos asignados' })
    }
    console.error(error)
    res.status(500).json({ error: 'Error al borrar el repartidor' })
  }
})

app.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`)
})