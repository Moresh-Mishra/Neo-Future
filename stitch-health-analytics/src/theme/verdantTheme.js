// Verdant Solace Design System Theme
// Health Analytics & Insights - React Theme Configuration

export const verdantTheme = {
  colors: {
    // Primary Palette - Sage Green
    primary: '#436745',
    primaryDim: '#375b3a',
    primaryContainer: '#c4edc2',
    primaryFixed: '#c4edc2',
    primaryFixedDim: '#b6dfb4',
    onPrimary: '#e9ffe5',
    onPrimaryContainer: '#365a39',
    onPrimaryFixed: '#244728',
    onPrimaryFixedVariant: '#406442',

    // Secondary Palette
    secondary: '#526451',
    secondaryDim: '#465845',
    secondaryContainer: '#d4e8d0',
    secondaryFixed: '#d4e8d0',
    secondaryFixedDim: '#c6dac3',
    onSecondary: '#eaffe6',
    onSecondaryContainer: '#455644',
    onSecondaryFixed: '#334333',
    onSecondaryFixedVariant: '#4e604e',

    // Tertiary Palette
    tertiary: '#5d632f',
    tertiaryDim: '#515724',
    tertiaryContainer: '#f8ffbc',
    tertiaryFixed: '#f8ffbc',
    tertiaryFixedDim: '#eaf0af',
    onTertiary: '#f8febc',
    onTertiaryContainer: '#5d632f',
    onTertiaryFixed: '#4b501f',
    onTertiaryFixedVariant: '#676e39',

    // Error Palette
    error: '#a73b21',
    errorDim: '#791903',
    errorContainer: '#fd795a',
    onError: '#fff7f6',
    onErrorContainer: '#6e1400',

    // Surface Palette
    surface: '#f8faf3',
    surfaceDim: '#d5dcd0',
    surfaceBright: '#f8faf3',
    surfaceContainerLow: '#f1f5ec',
    surfaceContainer: '#eaf0e5',
    surfaceContainerHigh: '#e4eadf',
    surfaceContainerHighest: '#dde5d9',
    surfaceContainerLowest: '#ffffff',
    surfaceVariant: '#dde5d9',
    onSurface: '#2d342c',
    onSurfaceVariant: '#596158',

    // Background
    background: '#f8faf3',
    onBackground: '#2d342c',

    // Outline
    outline: '#757d73',
    outlineVariant: '#acb4a9',

    // Inverse
    inverseSurface: '#0c0f0b',
    inverseOnSurface: '#9b9e98',
    inversePrimary: '#d4ffd2',

    // Utility
    surfaceTint: '#436745',
  },

  // Brand Colors (Custom)
  brand: {
    sageGreen: '#7DA47D',
    forestGreen: '#526451',
    emerald: '#436745',
  },

  typography: {
    fontFamily: {
      headline: "'Manrope', sans-serif",
      body: "'Manrope', sans-serif",
      label: "'Manrope', sans-serif",
    },
    fontSize: {
      display: '3.5rem',
      headline: '2rem',
      title: '1.5rem',
      body: '1rem',
      label: '0.875rem',
      small: '0.75rem',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    full: '9999px',
  },

  shadows: {
    botanical: '0px 20px 40px rgba(45, 52, 44, 0.06)',
    soft: '0px 4px 12px rgba(45, 52, 44, 0.04)',
    medium: '0px 8px 24px rgba(45, 52, 44, 0.08)',
    large: '0px 16px 48px rgba(45, 52, 44, 0.12)',
  },

  gradients: {
    primary: 'linear-gradient(145deg, #436745, #375b3a)',
    sage: 'linear-gradient(135deg, #7DA47D, #436745)',
    surface: 'linear-gradient(180deg, #f8faf3 0%, #eaf0e5 100%)',
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },

  // Component-specific styles
  components: {
    button: {
      primary: {
        background: '#436745',
        color: '#e9ffe5',
        hoverBackground: '#375b3a',
        borderRadius: '9999px',
        padding: '0.75rem 1.5rem',
        fontWeight: 600,
      },
      secondary: {
        background: '#c4edc2',
        color: '#365a39',
        hoverBackground: '#b6dfb4',
        borderRadius: '9999px',
        padding: '0.75rem 1.5rem',
        fontWeight: 600,
      },
      outline: {
        border: '2px solid #436745',
        color: '#436745',
        hoverBackground: '#f1f5ec',
        borderRadius: '9999px',
        padding: '0.75rem 1.5rem',
        fontWeight: 600,
      },
    },
    card: {
      background: '#ffffff',
      borderRadius: '1rem',
      border: '1px solid #eaf0e5',
      padding: '1.5rem',
      hoverShadow: '0px 20px 40px rgba(45, 52, 44, 0.06)',
    },
    input: {
      background: '#f1f5ec',
      border: '1px solid #dde5d9',
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem',
      focusBorder: '#436745',
      focusRing: '0 0 0 3px rgba(67, 103, 69, 0.1)',
    },
  },
};

// CSS Custom Properties for global use
export const cssVariables = `
:root {
  /* Primary */
  --color-primary: #436745;
  --color-primary-dim: #375b3a;
  --color-primary-container: #c4edc2;
  --color-on-primary: #e9ffe5;

  /* Secondary */
  --color-secondary: #526451;
  --color-secondary-container: #d4e8d0;
  --color-on-secondary: #eaffe6;

  /* Surface */
  --color-surface: #f8faf3;
  --color-surface-container: #eaf0e5;
  --color-surface-container-low: #f1f5ec;
  --color-surface-container-high: #e4eadf;
  --color-on-surface: #2d342c;
  --color-on-surface-variant: #596158;

  /* Brand */
  --color-brand-sage: #7DA47D;
  --color-brand-forest: #526451;

  /* Typography */
  --font-headline: 'Manrope', sans-serif;
  --font-body: 'Manrope', sans-serif;
  --font-label: 'Manrope', sans-serif;

  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-botanical: 0px 20px 40px rgba(45, 52, 44, 0.06);
  --shadow-soft: 0px 4px 12px rgba(45, 52, 44, 0.04);
}
`;

export default verdantTheme;
