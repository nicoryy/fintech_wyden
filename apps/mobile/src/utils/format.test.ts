import { brl, brlParts } from './format';

// Note: the non-breaking thousands separator pt-BR uses on Node's Intl is the
// regular '.' here (jest-expo runs on full ICU), so we assert on '.' / ',' as the
// prototype's HTML reference also rendered them.

describe('brl', () => {
  it('formats a positive value as R$ 1.234,56', () => {
    expect(brl(1234.56)).toBe('R$ 1.234,56');
  });

  it('always shows two decimal places', () => {
    expect(brl(10)).toBe('R$ 10,00');
    expect(brl(10.5)).toBe('R$ 10,50');
  });

  it('formats zero', () => {
    expect(brl(0)).toBe('R$ 0,00');
  });

  it('takes the absolute value (no minus) when sign is off', () => {
    expect(brl(-42.9)).toBe('R$ 42,90');
  });

  it('rounds to two decimals', () => {
    expect(brl(1899.8)).toBe('R$ 1.899,80');
    expect(brl(0.005)).toBe('R$ 0,01');
  });

  describe('with sign option', () => {
    it('prefixes a unicode minus + space for negatives', () => {
      expect(brl(-42.9, { sign: true })).toBe('− R$ 42,90');
    });

    it('prefixes a plus + space for positive values', () => {
      expect(brl(6250, { sign: true })).toBe('+ R$ 6.250,00');
    });

    it('treats zero as a positive sign', () => {
      expect(brl(0, { sign: true })).toBe('+ R$ 0,00');
    });
  });
});

describe('brlParts', () => {
  it('splits integer and decimal parts', () => {
    expect(brlParts(1234.56)).toEqual({ int: '1.234', dec: '56' });
  });

  it('uses absolute value', () => {
    expect(brlParts(-4350.2)).toEqual({ int: '4.350', dec: '20' });
  });

  it('pads decimals to two digits', () => {
    expect(brlParts(10)).toEqual({ int: '10', dec: '00' });
    expect(brlParts(10.5)).toEqual({ int: '10', dec: '50' });
  });

  it('handles zero', () => {
    expect(brlParts(0)).toEqual({ int: '0', dec: '00' });
  });

  it('keeps thousands grouping in the integer part', () => {
    expect(brlParts(4350.2).int).toBe('4.350');
  });
});
