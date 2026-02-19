/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
        display: ['Unbounded', 'sans-serif'],
      },
      colors: {
        accent: '#00FF87',
        'accent-dim': '#00c468',
        surface: '#0a1018',
        'surface-2': '#0f1820',
        border: '#1a2535',
        'border-2': '#243347',
        'text-2': '#6b849e',
        'text-3': '#3d5268',
      },
    },
  },
  plugins: [],
}