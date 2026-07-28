/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './plugins/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2B72E0',
          'blue-2': '#315FB6',
          cta: '#2563EB'
        },
        header: '#2B3E5C',
        'header-2': '#243349',
        accent: {
          yellow: '#FFD850',
          green: '#2BB673',
          red: '#E5484D'
        },
        ink: '#1c2433',
        muted: '#5b6678'
      },
      fontFamily: {
        serif: ['"EB Garamond"', 'Georgia', 'serif'],
        sans: ['"Golos Text"', 'Inter', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        xl2: '1.25rem'
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(20,40,80,0.18)',
        soft: '0 4px 18px -8px rgba(20,40,80,0.20)'
      },
      maxWidth: {
        container: '1180px'
      }
    }
  },
  plugins: []
}
