import { useEffect, useRef } from 'react'
import '../styles/ConfirmDialog.css'

function ConfirmDialog({
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  tipo = 'normal',
  icono,
  onConfirmar,
  onCancelar,
}) {
  const botonConfirmar = useRef(null)
  const botonCancelar = useRef(null)
  const cancelarRef = useRef(onCancelar)

  // FIX: sincronización del "latest ref" dentro de un effect,
  // no en el cuerpo del componente. Sin array de deps => corre tras
  // cada render y mantiene el ref con la última versión de onCancelar.
  useEffect(() => {
    cancelarRef.current = onCancelar
  })

  useEffect(() => {
    const inicial = tipo === 'peligro' ? botonCancelar : botonConfirmar
    inicial.current?.focus()

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        cancelarRef.current()
        return
      }
      if (e.key === 'Tab') {
        const primero = botonCancelar.current
        const ultimo = botonConfirmar.current
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault()
          ultimo.focus()
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault()
          primero.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = overflowAnterior
    }
  }, [tipo])

  const iconoFinal = icono || (tipo === 'peligro' ? 'fa-trash-can' : 'fa-circle-question')

  return (
    <div
      className="confirm-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancelar()
      }}
    >
      <div
        className="confirm-dialogo"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-titulo"
        aria-describedby="confirm-mensaje"
      >
        <div className={'confirm-icono ' + tipo}>
          <i className={'fa-solid ' + iconoFinal}></i>
        </div>

        <h3 id="confirm-titulo" className="confirm-titulo">{titulo}</h3>
        <p id="confirm-mensaje" className="confirm-mensaje">{mensaje}</p>

        <div className="confirm-botones">
          <button
            type="button"
            ref={botonCancelar}
            className="confirm-btn cancelar"
            onClick={onCancelar}
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            ref={botonConfirmar}
            className={'confirm-btn confirmar ' + tipo}
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog