import type { Config } from "tailwindcss";

const config: Config = {
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
        // Cyberpunk theme colors
        cyber: {
          dark: '#0a0a0a',
          darker: '#050505',
          green: '#00ff41',
          purple: '#9d00ff',
          blue: '#00bfff',
          pink: '#ff00ff',
          yellow: '#ffff00',
          red: '#ff0000',
          gray: '#1a1a1a',
          lightgray: '#2a2a2a',
        }
      },
      fontFamily: {
        'mono': ['"Courier New"', 'monospace'],
        'cyber': ['"Courier New"', 'monospace'],
      },
      boxShadow: {
        'cyber-green': '0 0 10px #00ff41, 0 0 20px #00ff41',
        'cyber-purple': '0 0 10px #9d00ff, 0 0 20px #9d00ff',
        'cyber-blue': '0 0 10px #00bfff, 0 0 20px #00bfff',
      },
      animation: {
        'scanline': 'scanline 8s linear infinite',
        'glitch': 'glitch 2s infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        }
      }
    },
  },
  plugins: [],
};

export default config;