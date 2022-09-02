/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["**/*.md", "**/*.html"],
    theme: {
        extend: {
            colors: {
                "black": "#212322",
                "gray": {
                    900: "rgba(33, 35, 34, 0.9)",
                    800: "rgba(33, 35, 34, 0.8)",
                    700: "rgba(33, 35, 34, 0.7)",
                    600: "rgba(33, 35, 34, 0.6)",
                    500: "rgba(33, 35, 34, 0.5)",
                    400: "rgba(33, 35, 34, 0.4)",
                    300: "rgba(33, 35, 34, 0.3)",
                    200: "rgba(33, 35, 34, 0.2)",
                    100: "rgba(33, 35, 34, 0.1)",
                    50: "rgba(33, 35, 34, 0.05)"
                },
                "gold": {
                    DEFAULT: "#b28d2f",
                    dark: "#9e7d29"
                }
            },
            fontFamily: {
                sans: "Montserrat Helvetica Arial sans-serif",
                bettertimes: "Better Times Helvetica Arial sans-serif"
            }
        },
    },
    plugins: [],
}
