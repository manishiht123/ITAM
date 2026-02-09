export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/pages/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Extend with custom values if needed
      // Most styling uses CSS variables from theme.css
    },
  },
  plugins: [],
  // Performance optimizations
  corePlugins: {
    // Disable unused core plugins to reduce CSS size
    preflight: true, // Keep for base styles
  },
  // Future-proof configuration
  future: {
    hoverOnlyWhenSupported: true, // Only add hover styles on devices that support hover
  },
};

