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
        // Light: background #FFFFFF, surface #F8FAFC, accent #6366F1 (indigo), text #0F172A, muted #64748B, border #E2E8F0
        // Dark:  background #0F172A, surface #1E293B, accent #818CF8, text #F1F5F9, muted #94A3B8, border #334155
        brand: {
          bg: {
            light: '#FFFFFF',
            dark: '#0F172A',
          },
          surface: {
            light: '#F8FAFC',
            dark: '#1E293B',
          },
          accent: {
            light: '#6366F1',
            dark: '#818CF8',
          },
          text: {
            light: '#0F172A',
            dark: '#F1F5F9',
          },
          muted: {
            light: '#64748B',
            dark: '#94A3B8',
          },
          border: {
            light: '#E2E8F0',
            dark: '#334155',
          }
        }
      },
      fontFamily: {
        cairo: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
