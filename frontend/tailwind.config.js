export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Space Grotesk", "Avenir Next", "Helvetica Neue", "sans-serif"],
                mono: ["IBM Plex Mono", "Menlo", "monospace"],
            },
            colors: {
                accent: "rgb(var(--accent-rgb) / <alpha-value>)",
            },
            boxShadow: {
                glow: "0 0 0 1px rgba(255,255,255,0.06), 0 20px 50px rgba(0,0,0,0.35)",
            },
            animation: {
                float: "float 8s ease-in-out infinite",
                pulseSoft: "pulseSoft 2.4s ease-in-out infinite",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-6px)" },
                },
                pulseSoft: {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.7" },
                },
            },
        },
    },
    plugins: [],
};
