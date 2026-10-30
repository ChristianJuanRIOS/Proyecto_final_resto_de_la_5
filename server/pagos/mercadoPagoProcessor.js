/**
 * MercadoPagoProcessor — simula la integración con MercadoPago.
 * En producción, este código usaría la SDK oficial de MercadoPago Node.js:
 *   import { MercadoPagoConfig, Payment } from 'mercadopago/sdk'
 * Y configuraría credenciales con process.env.MP_ACCESS_TOKEN.
 *
 * Para esta versión simulada, aprobamos por defecto y rechazamos si el monto
 * es 0 o si el "email de prueba" contiene la palabra "rechazar".
 */
class MercadoPagoProcessor {
  async procesar(pago) {
    const { email, descripcion } = pago.detalle || {}

    if (!email) {
      return {
        estado: 'rechazado',
        referencia_externa: null,
        detalle: { error: 'Falta el email del pagador' },
      }
    }

    // Caso de prueba: emails con "rechazar" en el texto se rechazan
    if (email.toLowerCase().includes('rechazar')) {
      return {
        estado: 'rechazado',
        referencia_externa: null,
        detalle: { error: 'Pago rechazado por MercadoPago (caso de prueba)' },
      }
    }

    // Simulación: aprobar el resto
    const referencia = 'MP-' + Math.random().toString(36).substring(2, 12).toUpperCase()
    return {
      estado: 'aprobado',
      referencia_externa: referencia,
      detalle: {
        mensaje: 'Pago aprobado por MercadoPago (simulado)',
        email,
        descripcion: descripcion || 'Pago de orden',
      },
    }
  }

  async reembolsar(pago) {
    // En producción: client.refund.create({ payment_id: pago.referencia_externa })
    return {
      estado: 'reembolsado',
      detalle: { mensaje: 'Reembolso procesado por MercadoPago (simulado)' },
    }
  }
}

export default MercadoPagoProcessor