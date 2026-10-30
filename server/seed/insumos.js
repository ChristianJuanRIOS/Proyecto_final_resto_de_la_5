import pool from '../db.js'

const insumos = [
  { nombre: 'Muzzarella', unidad: 'kg', stock_actual: 5, stock_minimo: 2 },
  { nombre: 'Harina', unidad: 'kg', stock_actual: 10, stock_minimo: 3 },
  { nombre: 'Tomate', unidad: 'kg', stock_actual: 4, stock_minimo: 2 },
  { nombre: 'Carne picada', unidad: 'kg', stock_actual: 6, stock_minimo: 2 },
  { nombre: 'Huevo', unidad: 'u', stock_actual: 30, stock_minimo: 12 },
  { nombre: 'Pan de hamburguesa', unidad: 'u', stock_actual: 20, stock_minimo: 10 },
  { nombre: 'Papas fritas', unidad: 'kg', stock_actual: 8, stock_minimo: 3 },
  { nombre: 'Gaseosa cola', unidad: 'u', stock_actual: 24, stock_minimo: 12 },
]

// Recetas: asocia cada insumo a un plato existente.
const recetas = [
  { plato_nombre: 'Pizza Muzzarella', insumos: [
    { nombre: 'Muzzarella', cantidad: 0.25 },
    { nombre: 'Harina', cantidad: 0.3 },
    { nombre: 'Tomate', cantidad: 0.15 },
  ]},
  { plato_nombre: 'Hamburguesa Clásica', insumos: [
    { nombre: 'Carne picada', cantidad: 0.15 },
    { nombre: 'Pan de hamburguesa', cantidad: 1 },
    { nombre: 'Papas fritas', cantidad: 0.2 },
  ]},
]

async function sembrar() {
  // 1. Insertar insumos
  const insumoIds = {}
  for (const ins of insumos) {
    const [r] = await pool.query(
      'INSERT INTO insumos (nombre, unidad, stock_actual, stock_minimo) VALUES (?, ?, ?, ?)',
      [ins.nombre, ins.unidad, ins.stock_actual, ins.stock_minimo]
    )
    insumoIds[ins.nombre] = r.insertId
    console.log(`✓ Insumo creado: ${ins.nombre}`)
  }

  // 2. Insertar recetas
  for (const rec of recetas) {
    const [[plato]] = await pool.query('SELECT id FROM menu_items WHERE nombre = ?', [rec.plato_nombre])
    if (!plato) {
      console.log(`⚠ Plato no encontrado: ${rec.plato_nombre}, se saltea su receta`)
      continue
    }
    for (const ins of rec.insumos) {
      const insumoId = insumoIds[ins.nombre]
      if (!insumoId) {
        console.log(`⚠ Insumo no encontrado: ${ins.nombre}`)
        continue
      }
      await pool.query(
        'INSERT INTO plato_insumos (plato_id, insumo_id, cantidad_necesaria) VALUES (?, ?, ?)',
        [plato.id, insumoId, ins.cantidad]
      )
    }
    console.log(`✓ Receta creada para: ${rec.plato_nombre}`)
  }

  await pool.end()
  console.log('Seed completo.')
  process.exit(0)
}

sembrar().catch(err => {
  console.error(err)
  process.exit(1)
})