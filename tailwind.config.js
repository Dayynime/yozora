/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          hover: 'var(--bg-surface-hover)',
        },
        line: {
          DEFAULT: 'var(--border-color)',
          subtle: 'var(--border-subtle)',
        },
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
        subtle: 'var(--text-subtle)',
        accent: {
          DEFAULT: '#d9432b',
          hover: '#bf351f',
        },
      },
      fontFamily: {
        serif: ['Shippori Mincho', 'serif'],
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '3px',
      }
    },
  },
  plugins: [],
}
