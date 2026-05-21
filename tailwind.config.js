/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0E120F',
        cream: '#F4EFE6',
        moss: '#6B7A5A',
        mist: '#E7E4DD',
        ember: '#D2772E',
        ink: '#14191A',
        muted: '#6B6F6A'
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Instrument Serif', 'Georgia', 'serif']
      },
      letterSpacing: {
        eyebrow: '0.2em',
        tightest: '-0.04em'
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        grain: {
          '0%, 100%': { transform: 'translate(0,0)' },
          '10%': { transform: 'translate(-5%,-10%)' },
          '20%': { transform: 'translate(-15%,5%)' },
          '30%': { transform: 'translate(7%,-25%)' },
          '40%': { transform: 'translate(-5%,25%)' },
          '50%': { transform: 'translate(-15%,10%)' },
          '60%': { transform: 'translate(15%,0%)' },
          '70%': { transform: 'translate(0%,15%)' },
          '80%': { transform: 'translate(3%,35%)' },
          '90%': { transform: 'translate(-10%,10%)' }
        }
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        grain: 'grain 8s steps(10) infinite'
      }
    }
  },
  plugins: []
};
