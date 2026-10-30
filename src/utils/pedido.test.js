import { describe, it, expect } from 'vitest'
import { calcularTotal } from './pedido'

describe('calcularTotal', () => {
  it('CP-01 [partición] suma varios ítems', () => {
    const items = [{ precio: 100, cantidad: 2 }, { precio: 50, cantidad: 1 }]
    expect(calcularTotal(items)).toBe(250)
  })
  it('CP-02 [valor límite] pedido vacío da 0', () => {
    expect(calcularTotal([])).toBe(0)
  })
  it('CP-03 [valor límite] descuento 0% y 100%', () => {
    const items = [{ precio: 100, cantidad: 1 }]
    expect(calcularTotal(items, 0)).toBe(100)
    expect(calcularTotal(items, 1)).toBe(0)
  })
  it('CP-04 [partición] descuento parcial', () => {
    expect(calcularTotal([{ precio: 200, cantidad: 1 }], 0.1)).toBe(180)
  })
})