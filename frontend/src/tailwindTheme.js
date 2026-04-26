const colors = {
  app: {
    bg: '#101715',
    bg2: '#141d1a',
    bg3: '#1b2622',
    card: '#17201d',
    border: '#27332f',
    accent: '#2f8f6b',
    accent2: '#9fd7bf',
    warn: '#c69238',
    danger: '#c65b4b',
    text: '#f3f1ea',
    text2: '#b7beb8',
    text3: '#7f8a83',
  },
};

const fontFamily = {
  display: ['Syne', 'sans-serif'],
  mono: ['"DM Mono"', 'monospace'],
};

const tailwindTheme = {
  colors,
  fontFamily,
  borderRadius: {
    card: '14px',
    panel: '18px',
  },
  boxShadow: {
    soft: '0 10px 30px rgba(0, 0, 0, 0.18)',
  },
};

const appTheme = {
  ...colors.app,
  fonts: {
    display: "'Syne', sans-serif",
    mono: "'DM Mono', monospace",
  },
};

module.exports = {
  appTheme,
  colors,
  fontFamily,
  tailwindTheme,
};
