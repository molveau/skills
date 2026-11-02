module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#f97316',
        page: 'rgb(var(--surface-page) / <alpha-value>)',
        chart: { 1: '#111111', 2: '#222222' },
        neutral: { 50: '#f5f5f5', 100: '#e5e5e5' },
        border: { DEFAULT: '#d4d4d4' },
      },
      fontSize: {
        '3xs': 'clamp(0.625rem, 0.6vw + 0.5rem, 0.6875rem)',
      },
    },
  },
};
