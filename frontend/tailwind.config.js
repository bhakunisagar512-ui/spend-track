const { tailwindTheme } = require('./src/tailwindTheme');

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: tailwindTheme,
  },
  plugins: [],
};
