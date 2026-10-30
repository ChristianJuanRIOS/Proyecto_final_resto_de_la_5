/**
 * TransferenciaProcessor — para transferencias bancarias.
 * A diferencia de Tarjeta y MercadoPago, una transferencia NO se aprueba automáticamente:
 * el cliente hace la transferencia desde su banco, sube el comprobante, y un ADMIN
 * la aprueba manualmente desde el panel.
 *
 * Por eso, procesar() acá solo deja el pago en estado 'pendiente' (no lo aprueba).
 * La aprobación se hace luego con el endpoint PATCH /api/pagos/:id/aprobar-transferencia.
 */
class TransferenciaProcessor {
  async procesar(pago) {
    const { cbu_destino, banco_origen } = pago.detalle || {}

    if (!cbu_destino || !banco_origen) {
      return {
        estado: 'rechazado',
        referencia_externa: null,
        detalle: { error: 'Faltan datos de la transferencia (CBU o banco de origen)' },
      }
    }

    // La transferencia queda pendiente hasta que un admin la apruebe manualmente
    return {
      estado: 'pendiente',
      referencia_externa: 'TRANSF-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      detalle: {
        mensaje: 'Transferencia registrada. Pendiente de verificación por admin.',
        cbu_destino,
        banco_origen,
      },
    }
  }

  async reembolsar(pago) {
    // Para transferencias: el reembolso se hace con otra transferencia de vuelta
    // (no se puede automatizar desde la pasarela, es manual)
    return {
      estado: 'reembolsado',
      detalle: {
        mensaje: 'Reembolso registrado (requiere transferencia bancaria manual al cliente)',
        referencia_original: pago.referencia_externa,
      },
    }
  }
}

export default TransferenciaProcessor