/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 병원/재활 SaaS 톤: 채도 낮은 청록-슬레이트 계열
        clinical: {
          50: '#f4f7f7',
          100: '#e4ebec',
          200: '#c9d8da',
          300: '#a2bdc0',
          400: '#729ca0',
          500: '#4f7e83',
          600: '#3d656a',
          700: '#345257',
          800: '#2e4448',
          900: '#293b3e',
          950: '#151f21'
        },
        alert: {
          amber: '#b7791f',
          red: '#b3423a'
        }
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', '-apple-system', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
