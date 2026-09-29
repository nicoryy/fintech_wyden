/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // brand / status
        primary: '#17A06A',
        'primary-wash': '#17A06A14',
        'primary-wash2': '#17A06A20',
        expense: '#F0742B',
        'expense-wash': '#FDEEE3',
        // insight (behavioral) — purple is EXCLUSIVE to insights
        insight: '#7C5CFC',
        'insight-ink': '#6A45E8',
        'insight-wash': '#F3F0FE',
        'insight-line': '#E2DBFC',
        'insight-chip': '#EBE5FE',
        // neutrals
        ink: '#1B1D21',
        'ink-2': '#62686F',
        muted: '#9AA0A7',
        line: '#ECEEF0',
        seg: '#EAECEF',
        background: '#F3F4F6',
        card: '#FFFFFF',
      },
      borderRadius: {
        card: '22px',
      },
      fontFamily: {
        sans: ['PlusJakarta_400Regular'],
        medium: ['PlusJakarta_500Medium'],
        semibold: ['PlusJakarta_600SemiBold'],
        bold: ['PlusJakarta_700Bold'],
        extrabold: ['PlusJakarta_800ExtraBold'],
      },
    },
  },
  plugins: [],
};
