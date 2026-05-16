import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { orange: '#C46849', blue: '#2C84DB' },
        charcoal: { 900: '#141413', 800: '#30302E' },
        stone: { 600: '#5E5D59' },
        lavender: { 100: '#CBCADB' },
        cream: { 100: '#FAF9F5', 50: '#F0EEE6' },
        beige: { 100: '#E3DACC' },
        error: '#B53333',
        success: '#629987'
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Source Serif 4', 'Georgia', 'Times New Roman', 'serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace']
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '16px',
        xl: '24px'
      },
      boxShadow: {
        shallow: 'rgba(0, 0, 0, 0.04) 0px 2px 8px 0px',
        standard: 'rgba(0, 0, 0, 0.05) 0px 4px 24px 0px',
        elevated: 'rgba(0, 0, 0, 0.08) 0px 6px 32px 0px',
        deep: 'rgba(0, 0, 0, 0.12) 0px 12px 48px 0px'
      },
      spacing: {
        '18': '72px',
        '22': '88px'
      }
    }
  },
  plugins: []
};

export default config;
