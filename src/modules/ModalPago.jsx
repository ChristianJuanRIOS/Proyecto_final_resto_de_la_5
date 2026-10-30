import { useState } from 'react'
import Modal from './Modal.jsx'
import { procesarPago } from '../scripts/api.js'
import '../styles/ModalPago.css'

function ModalPago({ orden, monto, envio, onExito, onCancelarOrden }) {
  const [pasarela, setPasarela] = useState('tarjeta')
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState(null)

  // ✅ FIX Bulletproof: si monto viene roto (NaN, undefined), lo recalculo desde los items
  const montoSeguro = (() => {
    const n = Number(monto)
    if (Number.isFinite(n) && n > 0) return n
    return (orden.items || []).reduce(
      (sum, item) => sum + Number(item.precio || 0) * Number(item.cantidad || 0),
      0
    )
  })()

  // Form state para tarjeta
  const [numTarjeta, setNumTarjeta] = useState('')
  const [cvv, setCvv] = useState('')
  const [expiracion, setExpiracion] = useState('')
  const [titular, setTitular] = useState('')

  // Form state para mercadopago
  const [emailMp, setEmailMp] = useState('')
  const [descMp, setDescMp] = useState('')

  // Form state para transferencia
  const [cbuDest, setCbuDest] = useState('')
  const [bancoOrig, setBancoOrig] = useState('')

  // ✅ NUEVO: Form state para efectivo
  const [montoRecibido, setMontoRecibido] = useState('')

  // ✅ NUEVO: cálculo del vuelto
  const vuelto = (() => {
    const recibido = Number(montoRecibido)
    if (!Number.isFinite(recibido) || recibido <= 0) return 0
    return Math.max(0, recibido - montoSeguro)
  })()

  function buildDetalle() {
    switch (pasarela) {
      case 'tarjeta':
        return {
          numero_tarjeta: numTarjeta.replace(/\s+/g, ''),
          cvv,
          expiracion,
          titular,
        }
      case 'mercadopago':
        return { email: emailMp, descripcion: descMp }
      case 'transferencia':
        return { cbu_destino: cbuDest, banco_origen: bancoOrig }
      case 'efectivo':
        return {
          monto_recibido: Number(montoRecibido) || montoSeguro,
          vuelto: vuelto,
        }
      default:
        return {}
    }
  }

  function validarVencimiento(valor) {
    const match = valor.match(/^(\d{2})\/(\d{2})$/)
    if (!match) return 'El vencimiento debe tener formato MM/AA (ej: 12/27)'
    const mes = parseInt(match[1], 10)
    const anio = parseInt(match[2], 10) + 2000
    if (mes < 1 || mes > 12) return 'El mes debe estar entre 01 y 12'
    const ahora = new Date()
    const anioActual = ahora.getFullYear()
    const mesActual = ahora.getMonth() + 1
    if (anio < anioActual || (anio === anioActual && mes < mesActual)) {
      return 'La tarjeta está vencida'
    }
    return null
  }

  function validarDetalle() {
    switch (pasarela) {
      case 'tarjeta':
        if (!numTarjeta || !cvv || !expiracion || !titular) return 'Completá todos los campos de la tarjeta'
        const limpio = numTarjeta.replace(/\s+/g, '')
        if (!/^\d{13,19}$/.test(limpio)) return 'El número de tarjeta debe tener entre 13 y 19 dígitos'
        if (!/^\d{3,4}$/.test(cvv)) return 'El CVV debe tener 3 o 4 dígitos'
        const errorVenc = validarVencimiento(expiracion)
        if (errorVenc) return errorVenc
        return null
      case 'mercadopago':
        if (!emailMp) return 'Indicá el email del pagador'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailMp)) return 'El email no es válido'
        return null
      case 'transferencia':
        if (!cbuDest || !bancoOrig) return 'Completá CBU y banco de origen'
        return null
      case 'efectivo':
        // Opcional: validar que el monto recibido sea >= al total
        if (montoRecibido && Number(montoRecibido) < montoSeguro) {
          return 'El monto recibido es menor al total a pagar'
        }
        return null
      default:
        return 'Pasarela inválida'
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const validacion = validarDetalle()
    if (validacion) { setError(validacion); return }
    setProcesando(true)
    try {
      const resultado = await procesarPago({
        orden_id: orden.id,
        pasarela,
        detalle: buildDetalle(),
      })
      onExito(resultado)
    } catch (err) {
      setError(err.message)
    } finally {
      setProcesando(false)
    }
  }

  function formatearTarjeta(valor) {
    const limpio = valor.replace(/\D/g, '').slice(0, 19)
    return limpio.replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  function formatearVencimiento(valor) {
    const limpio = valor.replace(/\D/g, '').slice(0, 4)
    if (limpio.length >= 3) return limpio.slice(0, 2) + '/' + limpio.slice(2)
    return limpio
  }

  return (
    <Modal
      titulo={`Pagar Orden #${orden.id}`}
      onClose={() => {}}
      maxAncho={500}
      cerrable={false}
    >
      <div className="pago-resumen">
        <div className="pago-mesa">
          {orden.mesa_numero
            ? `Mesa ${orden.mesa_numero}`
            : (envio ? 'Delivery' : (orden.mesa_id ? 'Mesa' : 'Delivery'))
          }
          {orden.mozo_nombre && ` · Tomada por ${orden.mozo_nombre}`}
        </div>
        <div className="pago-items">
          {orden.items?.map((item, idx) => (
            <div key={idx} className="pago-item">
              <span className="cantidad">{item.cantidad}×</span>
              <span className="nombre">{item.nombre}</span>
              <span className="precio">
                ${(Number(item.precio) * Number(item.cantidad)).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        {envio && (
          <div className="pago-item pago-envio-linea">
            <span className="cantidad">1×</span>
            <span className="nombre">Envío — {envio.descripcion}</span>
            <span className="precio">${Number(envio.costo).toFixed(2)}</span>
          </div>
        )}
        <div className="pago-total">
          <strong>Total: </strong>
          <span className="pago-total-monto">${montoSeguro.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="pago-form">
        <div className="pago-pasarelas">
          <label className={'pago-pasarela' + (pasarela === 'tarjeta' ? ' seleccionada' : '')}>
            <input
              type="radio"
              name="pasarela"
              value="tarjeta"
              checked={pasarela === 'tarjeta'}
              onChange={() => { setPasarela('tarjeta'); setError(null) }}
            />
            <i className="fa-solid fa-credit-card"></i>
            <span>Tarjeta</span>
          </label>
          <label className={'pago-pasarela' + (pasarela === 'mercadopago' ? ' seleccionada' : '')}>
            <input
              type="radio"
              name="pasarela"
              value="mercadopago"
              checked={pasarela === 'mercadopago'}
              onChange={() => { setPasarela('mercadopago'); setError(null) }}
            />
            <i className="fa-solid fa-wallet"></i>
            <span>MercadoPago</span>
          </label>
          <label className={'pago-pasarela' + (pasarela === 'transferencia' ? ' seleccionada' : '')}>
            <input
              type="radio"
              name="pasarela"
              value="transferencia"
              checked={pasarela === 'transferencia'}
              onChange={() => { setPasarela('transferencia'); setError(null) }}
            />
            <i className="fa-solid fa-building-columns"></i>
            <span>Transferencia</span>
          </label>
          {/* ✅ NUEVO: Efectivo */}
          <label className={'pago-pasarela' + (pasarela === 'efectivo' ? ' seleccionada' : '')}>
            <input
              type="radio"
              name="pasarela"
              value="efectivo"
              checked={pasarela === 'efectivo'}
              onChange={() => { setPasarela('efectivo'); setError(null) }}
            />
            <i className="fa-solid fa-money-bill-wave"></i>
            <span>Efectivo</span>
          </label>
        </div>

        {pasarela === 'tarjeta' && (
          <div className="pago-campos">
            <label className="pago-campo">
              <span>Número de tarjeta</span>
              <input
                type="text"
                value={numTarjeta}
                onChange={(e) => setNumTarjeta(formatearTarjeta(e.target.value))}
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                maxLength={19}
                required
              />
            </label>
            <div className="pago-doble">
              <label className="pago-campo">
                <span>Vencimiento (MM/AA)</span>
                <input
                  type="text"
                  value={expiracion}
                  onChange={(e) => setExpiracion(formatearVencimiento(e.target.value))}
                  placeholder="12/27"
                  maxLength={5}
                  required
                />
              </label>
              <label className="pago-campo">
                <span>CVV</span>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  inputMode="numeric"
                  maxLength={4}
                  required
                />
              </label>
            </div>
            <label className="pago-campo">
              <span>Titular</span>
              <input
                type="text"
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                placeholder="Nombre como figura en la tarjeta"
                required
              />
            </label>
            <p className="pago-ayuda">
              💡 Casos de prueba: cualquier tarjeta se aprueba, excepto las que terminan en <code>0000</code>.
              El vencimiento debe ser una fecha futura válida.
            </p>
          </div>
        )}

        {pasarela === 'mercadopago' && (
          <div className="pago-campos">
            <label className="pago-campo">
              <span>Email del pagador</span>
              <input
                type="email"
                value={emailMp}
                onChange={(e) => setEmailMp(e.target.value)}
                placeholder="ejemplo@gmail.com"
                required
              />
            </label>
            <label className="pago-campo">
              <span>Descripción (opcional)</span>
              <input
                type="text"
                value={descMp}
                onChange={(e) => setDescMp(e.target.value)}
                placeholder={`Orden #${orden.id}`}
              />
            </label>
            <p className="pago-ayuda">
              💡 Caso de prueba: cualquier email se aprueba, excepto los que contienen <code>rechazar</code>.
            </p>
          </div>
        )}

        {pasarela === 'transferencia' && (
          <div className="pago-campos">
            <label className="pago-campo">
              <span>CBU de destino</span>
              <input
                type="text"
                value={cbuDest}
                onChange={(e) => setCbuDest(e.target.value.replace(/\D/g, '').slice(0, 22))}
                placeholder="0000003100000000000001"
                inputMode="numeric"
                maxLength={22}
                required
              />
            </label>
            <label className="pago-campo">
              <span>Banco de origen</span>
              <select value={bancoOrig} onChange={(e) => setBancoOrig(e.target.value)} required>
                <option value="">Seleccioná tu banco</option>
                <option value="Banco Nación">Banco Nación</option>
                <option value="Banco Provincia">Banco Provincia</option>
                <option value="Banco Galicia">Banco Galicia</option>
                <option value="Banco Santander">Banco Santander</option>
                <option value="Banco BBVA">Banco BBVA</option>
                <option value="Banco Macro">Banco Macro</option>
                <option value="Banco Ciudad">Banco Ciudad</option>
                <option value="Otro">Otro</option>
              </select>
            </label>
            <p className="pago-ayuda">
              💡 La transferencia queda <strong>pendiente</strong> hasta que un admin la apruebe.
            </p>
          </div>
        )}

        {/* ✅ NUEVO: Form de efectivo */}
        {pasarela === 'efectivo' && (
          <div className="pago-campos">
            <label className="pago-campo">
              <span>Monto recibido del cliente (opcional)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={montoRecibido}
                onChange={(e) => setMontoRecibido(e.target.value)}
                placeholder={montoSeguro.toFixed(2)}
                inputMode="numeric"
              />
            </label>
            <div className="pago-efectivo-resumen">
              <div className="pago-efectivo-linea">
                <span>Total a pagar</span>
                <span>${montoSeguro.toFixed(2)}</span>
              </div>
              <div className="pago-efectivo-linea">
                <span>Recibido</span>
                <span>${Number(montoRecibido || 0).toFixed(2)}</span>
              </div>
              <div className={'pago-efectivo-linea' + (vuelto > 0 ? ' vuelto' : '')}>
                <strong>Vuelto</strong>
                <strong>${vuelto.toFixed(2)}</strong>
              </div>
            </div>
            <p className="pago-ayuda">
              💡 El pago en efectivo se aprueba automáticamente al confirmar.
              {montoRecibido && Number(montoRecibido) < montoSeguro && (
                <strong style={{ color: '#dc3545', display: 'block', marginTop: '0.25rem' }}>
                  ⚠ El monto recibido es menor al total. Faltan ${(montoSeguro - Number(montoRecibido)).toFixed(2)}.
                </strong>
              )}
            </p>
          </div>
        )}

        {error && <div className="pago-error">{error}</div>}

        <div className="pago-botones">
          <button type="submit" className="btn-primary" disabled={procesando}>
            {procesando ? 'Procesando...' : `Pagar $${montoSeguro.toFixed(2)}`}
          </button>
          <button
            type="button"
            onClick={onCancelarOrden}
            disabled={procesando}
            className="pago-cancelar"
          >
            Cancelar orden
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ModalPago