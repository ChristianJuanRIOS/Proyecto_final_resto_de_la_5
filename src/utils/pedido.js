export function calcularTotal(items, descuento = 0) {
  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  return subtotal - subtotal * descuento;
}