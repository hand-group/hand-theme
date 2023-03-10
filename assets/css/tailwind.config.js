module.exports = {
  content: ["content/**/*.md", "layouts/**/*.html", "themes/**/*.md", "themes/**/*.html"],
  theme: {
    extend: {
      colors: {
        black: "#212322",
        gold: {
          DEFAULT: "#b28d2f",
          dark: "#9e7d29",
        },
      },
      fontFamily: {
        sans: "Montserrat",
        bettertimes: "Better Times",
      },
    },
  },
  variants: {},
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")],
}
