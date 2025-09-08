/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2563EB",   // Primary blue
          light: "#3B82F6",    // Hover
          dark: "#1E40AF",     // Active
        },
        accent: {
          DEFAULT: "#10B981",  // Green (success)
          red: "#EF4444",      // Error
          yellow: "#F59E0B",   // Warning
        },
        neutral: {
          bg: "#F9FAFB",       // Background
          border: "#E5E7EB",   // Border
          text: "#374151",     // Default text
          lightText: "#6B7280" // Muted text
        },
      },
    },
  },
  plugins: [],
};
