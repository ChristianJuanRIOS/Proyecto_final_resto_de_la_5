/**
 * RetiroLocalCalculator — el cliente retira en el local (Take Away).
 * Sin costo de envío. Ideal para clientes que ya están cerca.
 */
class RetiroLocalCalculator {
  calcular(subtotal, distanciaKm = null) {
    return {
      costo: 0,
      descripcion: 'Retiro en local (Take Away)',
      detalle: { sin_cargo: true },
    }
  }
}

export default RetiroLocalCalculator