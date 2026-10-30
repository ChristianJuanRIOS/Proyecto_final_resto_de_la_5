import '../styles/MenuList.css'

function MenuList({ menu, onAgregar }) {
  // Agrupamos los items por categoria para que se vea mas ordenado
  const categorias = [...new Set(menu.map((item) => item.categoria))]

  return (
    <div className="menu-list">
      <h3>Menu</h3>
      {categorias.map((categoria) => (
        <div key={categoria} className="menu-categoria">
          <h4>{categoria}</h4>
          <ul>
            {menu
              .filter((item) => item.categoria === categoria)
              .map((item) => (
                <li key={item.id} className="menu-item">
                  <span className="menu-item-nombre">{item.nombre}</span>
                  <span className="menu-item-precio">${item.precio}</span>
                  <button className="btn-primary" onClick={() => onAgregar(item)}>
                    Agregar
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default MenuList