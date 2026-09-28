/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand color - a cyan-leaning "ocean blue" scale, computed via HSL
        // interpolation rather than Tailwind's stock (indigo-leaning) blue.
        // 600 is the primary action color (5.06:1 contrast against white text,
        // passes WCAG AA); 700 is the pressed/active-state shade (7.8:1, AAA).
        ocean: {
          50: '#F2F9FD',
          100: '#E0F2FA',
          200: '#BCE3F5',
          300: '#86CDEE',
          400: '#49B6E9',
          500: '#1699DA',
          600: '#0B74B1',
          700: '#07558D',
          800: '#073B69',
          900: '#07284A',
          950: '#06182D',
        },
      },
    },
  },
  plugins: [],
}
