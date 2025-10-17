import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './store/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cyan: '#00FFFF',
          teal: '#02D3C6'
        }
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(9, 9, 11, 0.85) 100%)'
      },
      boxShadow: {
        glow: '0 0 20px rgba(45, 212, 191, 0.35)'
      }
    }
  },
  plugins: []
};

export default config;


