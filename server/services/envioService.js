import MotoPropiaCalculator from '../envios/motoPropiaCalculator.js'
import CadeteriaExternaCalculator from '../envios/cadeteriaExternaCalculator.js'
import RetiroLocalCalculator from '../envios/retiroLocalCalculator.js'

/**
 * EnvioService — despacha al calculator de envío correcto según la modalidad.
 * Cumple SOLID igual que pagoService:
 * - SRP: solo despacha. Cada calculator conoce su modalidad.
 * - OCP: para sumar una modalidad nueva, agregás un calculator y lo registrás acá. No se toca otro código.
 * - DIP: depende de la abstracción (cualquier calculator con calcular()), no de detalles.
 */
class EnvioService {
  constructor() {
    this.calculators = {
      moto_propia: new MotoPropiaCalculator(),
      cadeteria_externa: new CadeteriaExternaCalculator(),
      retiro_local: new RetiroLocalCalculator(),
    }
  }

  /**
   * Calcula el costo de envío según la modalidad.
   * @param {string} modalidad - 'moto_propia' | 'cadeteria_externa' | 'retiro_local'
   * @param {number} subtotal - monto total de los items (para descuentos por monto mínimo, etc.)
   * @param {number|null} distanciaKm - solo relevante para moto_propia
   * @returns {{costo: number, descripcion: string, detalle: Object}}
   */
  calcular(modalidad, subtotal, distanciaKm = null) {
    const calc = this.calculators[modalidad]
    if (!calc) {
      throw new Error(`Modalidad de envío no soportada: ${modalidad}`)
    }
    return calc.calcular(subtotal, distanciaKm)
  }

  modalidadesDisponibles() {
    return Object.keys(this.calculators)
  }
}

export default new EnvioService()