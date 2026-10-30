import { useEffect, useRef } from 'react'
import '../styles/Modal.css'

function Modal({ titulo, onClose, children, maxAncho = 500, cerrable = true }) {
  const dialogoRef = useRef(null)

  // Guardamos los últimos valores de onClose y cerrable en refs
  // SIN disparar el useEffect. Así el effect solo corre en mount.
  const onCloseRef = useRef(onClose)
  const cerrableRef = useRef(cerrable)
  onCloseRef.current = onClose
  cerrableRef.current = cerrable

  useEffect(() => {
    // Foco inicial al dialog (solo en mount, no en cada render)
    dialogoRef.current?.focus()

    // Listener de Escape que lee las refs (siempre tiene el valor más reciente)
    function handleKeyDown(e) {
      if (e.key === 'Escape' && cerrableRef.current) {
        onCloseRef.current()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    // Bloquear scroll del body (solo en mount)
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = overflowAnterior
    }
  }, [])  // ← ARRAY VACÍO: solo corre en mount y cleanup en unmount

  function handleOverlayClick(e) {
    if (!cerrable) return
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onMouseDown={handleOverlayClick}>
      <div
        ref={dialogoRef}
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        style={{ maxWidth: maxAncho }}
      >
        <div className="modal-header">
          <h3>{titulo}</h3>
          {cerrable && (
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal