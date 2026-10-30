/**
 * MotoPropiaCalculator — tarifa base + adicional por km recorrido.
 * En producción podría integrar Google Maps API para calcular distancia real.
 */
class MotoPropiaCalculator {
  calcular(subtotal, distanciaKm = 5) {
    const tarifaBase = 500
    const adicionalPorKm = 100
    const distancia = Number(distanciaKm) || 5
    const costo = tarifaBase + (distancia * adicionalPorKm)

    return {
      costo: Number(costo.toFixed(2)),
      descripcion: `Moto propia (${distancia} km)`,
      detalle: {
        tarifa_base: tarifaBase,
        adicional_por_km: adicionalPorKm,
        distancia_km: distancia,
      },
    }
  }
}

export default MotoPropiaCalculator