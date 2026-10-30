const API_URL = 'http://localhost:3001/api'

function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function loginRequest(usuario, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, password }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Error al iniciar sesión')
  }
  return res.json()
}

export async function getMesas() {
  const res = await fetch(`${API_URL}/mesas`, {
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error('Error al obtener las mesas')
  return res.json()
}

export async function getMenu() {
  const res = await fetch(`${API_URL}/menu`, {
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error('Error al obtener el menu')
  return res.json()
}

export async function crearOrden({ mesaId, mozoNombre, items, enviarACocina = false }) {
  const res = await fetch(`${API_URL}/ordenes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ mesaId, mozoNombre, items, enviarACocina }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    // Si hay faltantes de stock, mostramos qué falta
    let mensaje = data.error || 'Error al crear la orden'
    if (data.faltantes && data.faltantes.length > 0) {
      const lista = data.faltantes
        .map((f) => `${f.insumo} (necesario: ${f.necesario}, disponible: ${f.disponible})`)
        .join(', ')
      mensaje = `Stock insuficiente: ${lista}`
    }
    throw new Error(mensaje)
  }
  return res.json()
}

export async function liberarMesa(mesaId) {
  const res = await fetch(`${API_URL}/mesas/${mesaId}/liberar`, {
    method: 'PATCH',
    headers: { ...authHeaders() },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Error al liberar la mesa')
  }
  return res.json()
}

export async function enviarACocina(ordenId) {
  const res = await fetch(`${API_URL}/ordenes/${ordenId}/enviar-a-cocina`, {
    method: 'PATCH',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error('Error al enviar la orden a cocina')
  return res.json()
}

// HU3: ordenes visibles para el cocinero (solo las que estan en_cocina)
export async function getOrdenesCocina() {
  const res = await fetch(`${API_URL}/ordenes/cocina`, {
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error('Error al obtener las ordenes de cocina')
  return res.json()
}

// HU4: el chef marca una orden como lista para servir
export async function marcarOrdenListo(ordenId) {
  const res = await fetch(`${API_URL}/ordenes/${ordenId}/marcar-listo`, {
    method: 'PATCH',
    headers: { ...authHeaders() },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Error al marcar la orden como lista')
  }
  return res.json()
}

// HU5: el admin agrega un plato al menu
export async function crearPlato({ nombre, categoria, precio }) {
  const res = await fetch(`${API_URL}/menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ nombre, categoria, precio }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Error al agregar el plato')
  }
  return res.json()
}

// Editar un plato del menu (solo admin)
export async function editarPlato(id, { nombre, categoria, precio }) {
  const res = await fetch(`${API_URL}/menu/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ nombre, categoria, precio }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Error al editar el plato')
  }
  return res.json()
}

// Borrar un plato del menu (solo admin)
export async function borrarPlato(id) {
  const res = await fetch(`${API_URL}/menu/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Error al borrar el plato')
  }
  return res.json()
}

// ---------- HU6: avisos de pedidos listos (mozo) ----------

// Pequeño ayudante para los pedidos nuevos: manda JSON con el token y devuelve JSON
async function pedirJson(ruta, opciones, mensajeError) {
  const res = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || mensajeError)
  }
  return res.json()
}

// Pedidos listos para servir (el mozo ve los suyos)
export function getOrdenesListas() {
  return pedirJson('/ordenes/listas', {}, 'Error al obtener los pedidos listos')
}

// El mozo marca un pedido como entregado
export function marcarEntregada(ordenId) {
  return pedirJson(`/ordenes/${ordenId}/entregar`, { method: 'PATCH' }, 'Error al entregar el pedido')
}

// ---------- HU10: gestion de mesas (admin) ----------

export function crearMesa({ numero, capacidad }) {
  return pedirJson('/mesas', {
    method: 'POST',
    body: JSON.stringify({ numero, capacidad }),
  }, 'Error al agregar la mesa')
}

export function editarMesa(id, { numero, capacidad }) {
  return pedirJson(`/mesas/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ numero, capacidad }),
  }, 'Error al editar la mesa')
}

// x e y son porcentajes del plano (0 a 100)
export function moverMesa(id, x, y) {
  return pedirJson(`/mesas/${id}/posicion`, {
    method: 'PATCH',
    body: JSON.stringify({ x, y }),
  }, 'Error al mover la mesa')
}

export function borrarMesa(id) {
  return pedirJson(`/mesas/${id}`, { method: 'DELETE' }, 'Error al borrar la mesa')
}

// ---------- STOCK: gestión de insumos y recetas ----------

export async function getInsumos() {
  const res = await fetch(`${API_URL}/insumos`, { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error('Error al obtener insumos')
  return res.json()
}

export async function crearInsumo({ nombre, unidad, stock_actual = 0, stock_minimo = 0 }) {
  return pedirJson('/insumos', {
    method: 'POST',
    body: JSON.stringify({ nombre, unidad, stock_actual, stock_minimo }),
  }, 'Error al crear el insumo')
}

export async function editarInsumo(id, { nombre, unidad, stock_minimo }) {
  return pedirJson(`/insumos/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ nombre, unidad, stock_minimo }),
  }, 'Error al editar el insumo')
}

// cantidad: positiva para compra, negativa para merma
// motivo: 'compra' | 'merma' | 'ajuste'
export async function ajustarStock(id, { cantidad, motivo }) {
  return pedirJson(`/insumos/${id}/ajustar`, {
    method: 'PATCH',
    body: JSON.stringify({ cantidad, motivo }),
  }, 'Error al ajustar el stock')
}

// Verifica si hay stock suficiente para los items de una orden
// items: [{ menu_item_id, cantidad }]
export async function verificarStock(items) {
  return pedirJson('/insumos/verificar', {
    method: 'POST',
    body: JSON.stringify({ items }),
  }, 'Error al verificar stock')
}

// Asignar receta a un plato: insumos = [{ insumo_id, cantidad_necesaria }]
export async function asignarReceta(platoId, insumos) {
  return pedirJson(`/menu/${platoId}/insumos`, {
    method: 'PUT',
    body: JSON.stringify({ insumos }),
  }, 'Error al asignar la receta')
}

// Ver la receta actual de un plato
export async function getRecetaPlato(platoId) {
  const res = await fetch(`${API_URL}/menu/${platoId}/insumos`, { headers: { ...authHeaders() } })
  if (!res.ok) throw new Error('Error al obtener la receta')
  return res.json()
}

// Cancelar una orden (devuelve el stock reservado)
export async function cancelarOrden(ordenId) {
  return pedirJson(`/ordenes/${ordenId}/cancelar`, {
    method: 'PATCH',
  }, 'Error al cancelar la orden')
}

// ---------- PAGOS (Módulo 2) ----------

// Procesar un pago para una orden
// detalle depende de la pasarela:
//   tarjeta: { numero_tarjeta, cvv, expiracion, titular }
//   mercadopago: { email, descripcion }
//   transferencia: { cbu_destino, banco_origen }
export function procesarPago({ orden_id, pasarela, detalle }) {
  return pedirJson('/pagos', {
    method: 'POST',
    body: JSON.stringify({ orden_id, pasarela, detalle }),
  }, 'Error al procesar el pago')
}

// Listar todos los pagos (solo admin) — opcionalmente filtrar por estado
export function getPagos(estado = null) {
  const query = estado ? `?estado=${estado}` : ''
  return pedirJson(`/pagos${query}`, {}, 'Error al obtener los pagos')
}

// Ver los pagos de una orden específica
export function getPagosOrden(ordenId) {
  return pedirJson(`/pagos/orden/${ordenId}`, {}, 'Error al obtener los pagos de la orden')
}

// Reembolsar un pago (solo admin)
export function reembolsarPago(pagoId) {
  return pedirJson(`/pagos/${pagoId}/reembolsar`, {
    method: 'PATCH',
  }, 'Error al reembolsar el pago')
}

// Aprobar manualmente una transferencia pendiente (solo admin)
export function aprobarTransferencia(pagoId) {
  return pedirJson(`/pagos/${pagoId}/aprobar-transferencia`, {
    method: 'PATCH',
  }, 'Error al aprobar la transferencia')
}

// ---------- DELIVERY (Módulo 3) ----------

export async function calcularEnvio({ modalidad, subtotal, distancia_km }) {
  const res = await fetch(`${API_URL}/envios/calcular`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ modalidad, subtotal, distancia_km }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Error al calcular el envío')
  }
  return res.json()
}

export function getModalidadesEnvio() {
  return pedirJson('/envios/modalidades', {}, 'Error al obtener modalidades')
}

export async function crearPedidoDelivery(datos) {
  const res = await fetch(`${API_URL}/delivery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(datos),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const err = new Error(data.error || 'Error al crear el pedido de delivery')
    err.faltantes = data.faltantes
    throw err
  }
  return res.json()
}

export function getPedidosDelivery(estado = null) {
  const query = estado ? `?estado=${estado}` : ''
  return pedirJson(`/delivery${query}`, {}, 'Error al obtener los pedidos de delivery')
}

export function asignarRepartidor(pedidoId, repartidorId) {
  return pedirJson(`/delivery/${pedidoId}/asignar-repartidor`, {
    method: 'PATCH',
    body: JSON.stringify({ repartidor_id: repartidorId }),
  }, 'Error al asignar el repartidor')
}

export function entregarDelivery(pedidoId) {
  return pedirJson(`/delivery/${pedidoId}/entregar`, {
    method: 'PATCH',
  }, 'Error al marcar como entregado')
}

// ---------- REPARTIDORES ----------

export function getRepartidores() {
  return pedirJson('/repartidores', {}, 'Error al obtener los repartidores')
}

export function crearRepartidor({ nombre, contacto }) {
  return pedirJson('/repartidores', {
    method: 'POST',
    body: JSON.stringify({ nombre, contacto }),
  }, 'Error al crear el repartidor')
}

export function editarRepartidor(id, { nombre, contacto, activo }) {
  return pedirJson(`/repartidores/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ nombre, contacto, activo }),
  }, 'Error al editar el repartidor')
}

export function borrarRepartidor(id) {
  return pedirJson(`/repartidores/${id}`, { method: 'DELETE' }, 'Error al borrar el repartidor')
}