/**
 * TarjetaProcessor — simula el cobro con tarjeta de crédito/débito.
 * En producción, este código se reemplazaría por la SDK de MercadoPago/Stripe/etc.
 * Recibe los datos de la tarjeta en pago.detalle: { numero_tarjeta, cvv, expiracion, titular }
 */
class TarjetaProcessor {
  async procesar(pago) {
    const { numero_tarjeta, cvv, expiracion, titular } = pago.detalle || {}

    // Validaciones mínimas
    if (!numero_tarjeta || !cvv || !expiracion || !titular) {
      return {
        estado: 'rechazado',
        referencia_externa: null,
        detalle: { error: 'Faltan datos de la tarjeta (número, CVV, expiración o titular)' },
      }
    }

    // Limpieza básica
    const limpio = String(numero_tarjeta).replace(/\s+/g, '')

    if (!/^\d{13,19}$/.test(limpio)) {
      return {
        estado: 'rechazado',
        referencia_externa: null,
        detalle: { error: 'El número de tarjeta no es válido (debe tener entre 13 y 19 dígitos)' },
      }
    }

    // Caso de prueba: tarjetas que terminan en 0000 se rechazan (para testear el flujo de rechazo)
    if (limpio.endsWith('0000')) {
      return {
        estado: 'rechazado',
        referencia_externa: null,
        detalle: { error: 'Tarjeta rechazada por la entidad bancaria (caso de prueba)' },
      }
    }

    // Simulación: aprobar el resto
    const referencia = 'TARJ-' + Math.random().toString(36).substring(2, 10).toUpperCase()
    return {
      estado: 'aprobado',
      referencia_externa: referencia,
      detalle: {
        mensaje: 'Pago aprobado (simulado)',
        ultimos_4: limpio.slice(-4),
        titular,
      },
    }
  }

  async reembolsar(pago) {
    // Simulación: en producción acá iría la llamada a la API de la pasarela para revertir
    return {
      estado: 'reembolsado',
      detalle: { mensaje: 'Reembolso procesado (simulado)', referencia_original: pago.referencia_externa },
    }
  }
}

export default TarjetaProcessor