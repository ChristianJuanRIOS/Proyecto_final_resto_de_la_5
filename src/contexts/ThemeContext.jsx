import { createContext, useContext, useState } from 'react'

const ThemeContext = createContext(null)

// El tema inicial lo deja puesto el script de index.html (antes de que cargue React),
// asi no hay un parpadeo de color al abrir la pagina.
function temaActual() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(temaActual)
  const oscuro = tema === 'dark'

  function alternarTema() {
    const nuevo = oscuro ? 'light' : 'dark'
    const html = document.documentElement

    // La clase "cambiando-tema" activa las transiciones suaves solo durante el cambio
    html.classList.add('cambiando-tema')
    html.setAttribute('data-theme', nuevo)
    setTema(nuevo)

    try {
      localStorage.setItem('tema', nuevo === 'dark' ? 'oscuro' : 'claro')
    } catch {
      // si el navegador no deja guardar, el tema igual cambia (solo no se recuerda)
    }

    setTimeout(() => html.classList.remove('cambiando-tema'), 500)
  }

  return (
    <ThemeContext.Provider value={{ oscuro, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTema() {
  return useContext(ThemeContext)
}