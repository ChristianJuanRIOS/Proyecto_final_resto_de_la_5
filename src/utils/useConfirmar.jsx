import { useState, useRef, useCallback } from 'react'
import ConfirmDialog from '../modules/ConfirmDialog.jsx'

export function useConfirmar() {
  const [opciones, setOpciones] = useState(null)
  const resolverRef = useRef(null)

  const confirmar = useCallback((config) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setOpciones(config)
    })
  }, [])

  function responder(valor) {
    resolverRef.current?.(valor)
    resolverRef.current = null
    setOpciones(null)
  }

  const dialogoConfirmar = opciones && (
    <ConfirmDialog
      {...opciones}
      onConfirmar={() => responder(true)}
      onCancelar={() => responder(false)}
    />
  )

  return { confirmar, dialogoConfirmar }
}