import pool from '../db.js'

/**
 * StockService — gestiona insumos, recetas y movimientos de stock.
 * Cumple SRP: su única responsabilidad es el inventario.
 * Cumple DIP: no sabe nada de órdenes, pagos ni envíos — solo expone
 *              verificarDisponibilidad / reservar / liberar que otros servicios llaman.
 */
class StockService {
  /**
   * Verifica si hay stock suficiente para armar una orden.
   * @param {Array<{menu_item_id, cantidad}>} items
   * @returns {Promise<{disponible: boolean, faltantes: Array}>}
   */
  async verificarDisponibilidad(items) {
    const demanda = await this._calcularDemanda(items)
    const faltantes = []

    for (const [insumoId, requerido] of Object.entries(demanda)) {
      const [[insumo]] = await pool.query(
        'SELECT id, nombre, stock_actual FROM insumos WHERE id = ?',
        [insumoId]
      )
      const disponible = Number(insumo?.stock_actual ?? 0)
      if (disponible < requerido) {
        faltantes.push({
          insumo_id: Number(insumoId),
          insumo: insumo?.nombre ?? `Insumo #${insumoId}`,
          disponible,
          necesario: requerido,
        })
      }
    }

    return { disponible: faltantes.length === 0, faltantes }
  }

  /**
   * Reserva (descuenta) el stock al confirmar una orden.
   * Acepta una conexión externa para soportar transacciones (OCP: si no la recibe, usa el pool).
   * @param {Array<{menu_item_id, cantidad}>} items
   * @param {number} ordenId
   * @param {import('mysql2/promise').PoolConnection} conexion
   */
  async reservar(items, ordenId, conexion = null) {
    const db = conexion || pool
    const demanda = await this._calcularDemanda(items, conexion)

    for (const [insumoId, cantidad] of Object.entries(demanda)) {
      await db.query(
        'UPDATE insumos SET stock_actual = stock_actual - ? WHERE id = ?',
        [cantidad, insumoId]
      )
      await db.query(
        `INSERT INTO movimientos_stock (insumo_id, cantidad, motivo, orden_id)
         VALUES (?, ?, 'pedido', ?)`,
        [insumoId, -cantidad, ordenId]
      )
    }
  }

  /**
   * Libera (devuelve) el stock cuando se cancela una orden.
   * Solo revierte movimientos de motivo 'pedido'; no toca los de 'compra'/'merma'/'ajuste'.
   * @param {number} ordenId
   * @param {import('mysql2/promise').PoolConnection} conexion
   */
  async liberar(ordenId, conexion = null) {
    const db = conexion || pool
    const [movimientos] = await db.query(
      `SELECT insumo_id, cantidad FROM movimientos_stock
       WHERE orden_id = ? AND motivo = 'pedido'`,
      [ordenId]
    )

    for (const mov of movimientos) {
      const cantidadADevolver = -Number(mov.cantidad) // era negativo, ahora positivo
      await db.query(
        'UPDATE insumos SET stock_actual = stock_actual + ? WHERE id = ?',
        [cantidadADevolver, mov.insumo_id]
      )
      await db.query(
        `INSERT INTO movimientos_stock (insumo_id, cantidad, motivo, orden_id)
         VALUES (?, ?, 'cancelacion', ?)`,
        [mov.insumo_id, cantidadADevolver, ordenId]
      )
    }
  }

  /**
   * Suma la demanda total por insumo a partir de los items de una orden.
   * Privado (no se expone). SRP: esta lógica vive acá y no se repite.
   */
  async _calcularDemanda(items, conexion = null) {
    const db = conexion || pool
    const demanda = {} // { insumo_id: cantidadTotalRequerida }

    for (const item of items) {
      const [insumosDelPlato] = await db.query(
        `SELECT insumo_id, cantidad_necesaria FROM plato_insumos WHERE plato_id = ?`,
        [item.menu_item_id]
      )
      for (const ins of insumosDelPlato) {
        const cantidad = Number(ins.cantidad_necesaria) * Number(item.cantidad)
        demanda[ins.insumo_id] = (demanda[ins.insumo_id] || 0) + cantidad
      }
    }

    return demanda
  }
}

// Singleton: una sola instancia compartida por toda la app
export default new StockService()
