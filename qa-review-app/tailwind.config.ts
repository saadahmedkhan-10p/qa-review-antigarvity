import type { Config } from "tailwindcss";

const config = {
    darkMode: 'class',
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/types/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
        },
    },
    safelist: [
        // Status and Role badge colors
        {
            pattern: /(bg|text|border)-(green|blue|yellow|orange|purple|gray|pink|rose|cyan|teal|indigo|violet|emerald|amber|fuchsia)-(50|100|200|300|400|500|600|700|800|900)/,
        },
        {
            pattern: /(bg|text|border)-(green|blue|yellow|orange|purple|gray|pink|rose|cyan|teal|indigo|violet|emerald|amber|fuchsia)-(50|100|200|300|400|500|600|700|800|900)/,
            variants: ['dark'],
        },
        // Specific opacity variants for status badges
        'dark:bg-green-900/30',
        'dark:bg-blue-900/30',
        'dark:bg-yellow-900/30',
        'dark:bg-orange-900/30',
        'dark:bg-purple-900/30',
        'dark:bg-indigo-900/30',
        'dark:bg-violet-900/30',
    ],
    plugins: [],
};
export default config;
