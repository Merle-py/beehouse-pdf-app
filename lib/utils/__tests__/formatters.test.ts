import { formatCurrency } from '../formatters'

describe('formatCurrency', () => {
    it('formats Brazilian currency correctly with numbers', () => {
        // Note: Intl.NumberFormat uses non-breaking space (U+00A0) between R$ and amount
        expect(formatCurrency(1000)).toBe('R$\u00A01.000,00')
        expect(formatCurrency(1234.56)).toBe('R$\u00A01.234,56')
        expect(formatCurrency(0)).toBe('R$\u00A00,00')
    })

    it('handles negative values', () => {
        expect(formatCurrency(-500)).toBe('-R$\u00A0500,00')
    })

    it('handles decimal precision', () => {
        expect(formatCurrency(10.5)).toBe('R$\u00A010,50')
        expect(formatCurrency(10.999)).toBe('R$\u00A011,00') // rounds
    })

    it('handles invalid inputs', () => {
        // Note: Invalid inputs return hardcoded 'R$ 0,00' with regular space (not NBSP)
        expect(formatCurrency('invalid')).toBe('R$ 0,00')
        expect(formatCurrency(NaN)).toBe('R$ 0,00')
    })
})
