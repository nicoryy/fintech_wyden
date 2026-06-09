/**
 * Default bank accounts seeded for every new user so the app has accounts to
 * pick from out of the box. Colors/short labels match the mobile design tiles.
 */
export interface DefaultBank {
  name: string;
  short: string;
  color: string;
}

export const DEFAULT_BANKS: DefaultBank[] = [
  { name: 'Nubank', short: 'Nu', color: '#8A05BE' },
  { name: 'Banco do Brasil', short: 'BB', color: '#F4C400' },
  { name: 'Caixa', short: 'CX', color: '#1A6CC4' },
  { name: 'Itaú', short: 'It', color: '#EC7000' },
  { name: 'Inter', short: 'In', color: '#FF6B00' },
  { name: 'Dinheiro', short: '$', color: '#17A06A' },
];
