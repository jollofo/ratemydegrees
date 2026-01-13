import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#fdf6e3", // Solarized-style parchment
                foreground: "#433422", // Deep coffee brown
                earth: {
                    parchment: "#fdf6e3",
                    terracotta: "#c36b4e",
                    sage: "#8b9467",
                    mustard: "#d4a017",
                    burgundy: "#800020",
                    clay: "#b5835a",
                },
                primary: {
                    50: "#fdf8f6",
                    100: "#f9ebe6",
                    200: "#f0cdc1",
                    300: "#e6ae9d",
                    400: "#d37255",
                    500: "#c36b4e", // Terracotta
                    600: "#af6046",
                    700: "#92503a",
                    800: "#75402f",
                    900: "#603426",
                    950: "#381e16",
                },
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
                funky: ["Bricolage Grotesque", "serif"],
                mono: ["Courier Prime", "monospace"],
            },
        },
    },
    plugins: [],
};
export default config;
