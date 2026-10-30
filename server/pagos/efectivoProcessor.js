class EfectivoProcessor {
  procesar(pago) {
    // El monto lo calcula el backend desde los items de la orden.
    // Como el mozo confirmó que recibió el efectivo, se aprueba al instante.
    const referencia = 'EFEC-' + Date.now().toString(36).toUpperCase()
    return {
      estado: 'aprobado',
      referencia_externa: referencia,
      detalle: {
        mensaje: 'Pago en efectivo confirmado por el mozo (simulado)',
        monto_recibido: pago.monto,
        vuelto: 0,
      },
    }
  }

  reembolsar(pago) {
    // El reembolso en efectivo se hace en mano (no se puede automatizar desde el sistema)
    return {
      estado: 'reembolsado',
      detalle: {
        mensaje: 'Reembolso en efectivo (requiere entrega manual al cliente)',
        referencia_original: pago.referencia_externa,
      },
    }
  }
}

export default EfectivoProcessor