/**
 * CadeteriaExternaCalculator — tarifa fija sin importar la distancia.
 * Es más caro que moto propia, pero útil cuando no hay motos disponibles.
 */
class CadeteriaExternaCalculator {
  calcular(subtotal, distanciaKm = null) {
    const tarifaFija = 800
    return {
      costo: tarifaFija,
      descripcion: 'Cadetería externa (tarifa fija)',
      detalle: { tarifa_fija: tarifaFija },
    }
  }
}

export default CadeteriaExternaCalculator