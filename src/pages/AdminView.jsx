import { useState } from 'react'
import AdminMenu from '../modules/AdminMenu.jsx'
import AdminMesas from '../modules/AdminMesas.jsx'
import AdminInsumos from '../modules/AdminInsumos.jsx'
import AdminPagos from '../modules/AdminPagos.jsx'
import AdminRepartidores from '../modules/AdminRepartidores.jsx'
import '../styles/AdminView.css'

function AdminView() {
  const [seccion, setSeccion] = useState('menu')

  return (
    <div>
      <h1>Panel de Administración</h1>

      <div className="admin-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={seccion === 'menu'}
          className={'admin-tab' + (seccion === 'menu' ? ' activa' : '')}
          onClick={() => setSeccion('menu')}
        >
          Menú
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={seccion === 'mesas'}
          className={'admin-tab' + (seccion === 'mesas' ? ' activa' : '')}
          onClick={() => setSeccion('mesas')}
        >
          Mesas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={seccion === 'insumos'}
          className={'admin-tab' + (seccion === 'insumos' ? ' activa' : '')}
          onClick={() => setSeccion('insumos')}
        >
          Insumos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={seccion === 'pagos'}
          className={'admin-tab' + (seccion === 'pagos' ? ' activa' : '')}
          onClick={() => setSeccion('pagos')}
        >
          Pagos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={seccion === 'repartidores'}
          className={'admin-tab' + (seccion === 'repartidores' ? ' activa' : '')}
          onClick={() => setSeccion('repartidores')}
        >
          Repartidores
        </button>
      </div>

      {seccion === 'menu' && <AdminMenu />}
      {seccion === 'mesas' && <AdminMesas />}
      {seccion === 'insumos' && <AdminInsumos />}
      {seccion === 'pagos' && <AdminPagos />}
      {seccion === 'repartidores' && <AdminRepartidores />}
    </div>
  )
}

export default AdminView