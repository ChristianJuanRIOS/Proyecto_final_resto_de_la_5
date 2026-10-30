import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import Navbar from './modules/Navbar.jsx'
import ThemeToggle from './modules/ThemeToggle.jsx'
import MozoView from './pages/MozoView.jsx'
import CocineroView from './pages/CocineroView.jsx'
import ChefView from './pages/ChefView.jsx'
import AdminView from './pages/AdminView.jsx'
import LoginView from './pages/LoginView.jsx'
import RutaProtegida from './modules/RutaProtegida.jsx'
import './styles/TablaScroll.css'

function App() {
  return (
    <ThemeProvider>
      <div className="app">
        <Navbar />
        <main className="app-content">
          <Routes>
            <Route path="/login" element={<LoginView />} />
            <Route path="/" element={
              <RutaProtegida rolesPermitidos={['mozo', 'admin']}><MozoView /></RutaProtegida>
            } />
            <Route path="/cocinero" element={
              <RutaProtegida rolesPermitidos={['cocinero', 'admin']}><CocineroView /></RutaProtegida>
            } />
            <Route path="/chef" element={
              <RutaProtegida rolesPermitidos={['chef', 'admin']}><ChefView /></RutaProtegida>
            } />
            <Route path="/admin" element={
              <RutaProtegida rolesPermitidos={['admin']}><AdminView /></RutaProtegida>
            } />
          </Routes>
        </main>

        {/* Botón flotante de modo oscuro (el admin en celular lo usa desde la hamburguesa) */}
        <ThemeToggle />
      </div>
    </ThemeProvider>
  )
}

export default App