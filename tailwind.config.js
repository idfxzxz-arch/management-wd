module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        navy: {
          50: "#eef5ff",
          100: "#d9eaff",
          700: "#173b6d",
          800: "#12305a",
          900: "#0b1f3a",
        },
      },
      boxShadow: {
        soft: "0 14px 40px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
