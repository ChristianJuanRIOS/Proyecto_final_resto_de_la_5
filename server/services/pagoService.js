import TarjetaProcessor from '../pagos/tarjetaProcessor.js'
import MercadoPagoProcessor from '../pagos/mercadoPagoProcessor.js'
import TransferenciaProcessor from '../pagos/transferenciaProcessor.js'
import EfectivoProcessor from '../pagos/efectivoProcessor.js'

/**
 * PagoService — orquesta el procesamiento de pagos delegando a la pasarela correcta.
 */
class PagoService {
  constructor() {
    // Registro de pasarelas: la clave es el string que viene del frontend
    this.processors = {
      tarjeta: new TarjetaProcessor(),
      mercadopago: new MercadoPagoProcessor(),
      transferencia: new TransferenciaProcessor(),
       efectivo: new EfectivoProcessor(),
    }
  }

  /**
   * Procesa un pago usando la pasarela indicada.
   * @param {{orden_id, monto, pasarela, detalle}} pago
   * @returns {Promise<{estado, referencia_externa, detalle}>}
   */
  async procesar(pago) {
    const processor = this.processors[pago.pasarela]
    if (!processor) {
      throw new Error(`Pasarela de pago no soportada: ${pago.pasarela}`)
    }
    return processor.procesar(pago)
  }

  /**
   * Reembolsa un pago previamente aprobado.
   * @param {Object} pago - registro de la DB (con pasarela y referencia_externa)
   * @returns {Promise<{estado, detalle}>}
   */
  async reembolsar(pago) {
    const processor = this.processors[pago.pasarela]
    if (!processor) {
      throw new Error(`Pasarela de pago no soportada: ${pago.pasarela}`)
    }
    return processor.reembolsar(pago)
  }

  /**
   * Devuelve las pasarelas disponibles (para que el frontend las liste).
   * Útil si mañana agregás PayPal y querés que el front lo descubra solo.
   */
  pasarelasDisponibles() {
    return Object.keys(this.processors)
  }
}

export default new PagoService()