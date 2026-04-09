/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Palette - Sage Green
        primary: '#436745',
        'primary-dim': '#375b3a',
        'primary-container': '#c4edc2',
        'primary-fixed': '#c4edc2',
        'primary-fixed-dim': '#b6dfb4',
        'on-primary': '#e9ffe5',
        'on-primary-container': '#365a39',

        // Secondary Palette
        secondary: '#526451',
        'secondary-dim': '#465845',
        'secondary-container': '#d4e8d0',
        'secondary-fixed': '#d4e8d0',
        'secondary-fixed-dim': '#c6dac3',
        'on-secondary': '#eaffe6',
        'on-secondary-container': '#455644',

        // Tertiary Palette
        tertiary: '#5d632f',
        'tertiary-dim': '#515724',
        'tertiary-container': '#f8ffbc',
        'tertiary-fixed': '#f8ffbc',
        'tertiary-fixed-dim': '#eaf0af',
        'on-tertiary': '#f8febc',
        'on-tertiary-container': '#5d632f',

        // Error Palette
        error: '#a73b21',
        'error-dim': '#791903',
        'error-container': '#fd795a',
        'on-error': '#fff7f6',
        'on-error-container': '#6e1400',

        // Surface Palette
        surface: '#f8faf3',
        'surface-dim': '#d5dcd0',
        'surface-bright': '#f8faf3',
        'surface-container-low': '#f1f5ec',
        'surface-container': '#eaf0e5',
        'surface-container-high': '#e4eadf',
        'surface-container-highest': '#dde5d9',
        'surface-container-lowest': '#ffffff',
        'surface-variant': '#dde5d9',
        'on-surface': '#2d342c',
        'on-surface-variant': '#596158',

        // Background
        background: '#f8faf3',
        'on-background': '#2d342c',

        // Outline
        outline: '#757d73',
        'outline-variant': '#acb4a9',

        // Inverse
        'inverse-surface': '#0c0f0b',
        'inverse-on-surface': '#9b9e98',
        'inverse-primary': '#d4ffd2',

        // Brand Colors
        brand: {
          sage: '#7DA47D',
          forest: '#526451',
        },
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        label: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        'DEFAULT': '0.5rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '2rem',
        'full': '9999px',
      },
      boxShadow: {
        'botanical': '0px 20px 40px rgba(45, 52, 44, 0.06)',
        'soft': '0px 4px 12px rgba(45, 52, 44, 0.04)',
        'medium': '0px 8px 24px rgba(45, 52, 44, 0.08)',
        'large': '0px 16px 48px rgba(45, 52, 44, 0.12)',
      },
    },
  },
  plugins: [],
};
