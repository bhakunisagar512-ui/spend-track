const colors = {
  app: {
    bg: '#0e0f12',
    bg2: '#16181d',
    bg3: '#1c1e24',
    card: '#1e2028',
    border: '#2a2c38',
    accent: '#7c6dfa',
    accent2: '#00d4a0',
    warn: '#f5a623',
    danger: '#ff5f5f',
    text: '#eeeef5',
    text2: '#8a8aa8',
    text3: '#484860',
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
