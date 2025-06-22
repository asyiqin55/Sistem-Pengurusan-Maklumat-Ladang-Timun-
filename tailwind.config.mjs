/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cucumber: {
          light: '#C5E1A5',
          DEFAULT: '#9CCC65',
          dark: '#689F38',
          cream: '#F0F4C3',
        },
      },
      
    },
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        '.btn': {
          backgroundColor: '#9CCC65',
          color: '#fff',
          padding: '0.5rem 1rem',
          borderRadius: '0.25rem',
          transition: 'background-color 0.3s ease',
          '&:hover': {
            backgroundColor: '#689F38',
          },
          '&:active': {
            backgroundColor: '#437020',
          },
        },
      })
    },
    function ({ addComponents }) {
      addComponents({
        '.glassmorphism': {
          background: 'rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
        },
      })
    }
  ],
};
