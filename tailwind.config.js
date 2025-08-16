/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f9f4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#4C9B6F', // Main primary color
                    600: '#1A5E3A', // Dark primary color
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
                secondary: {
                    50: '#f0f9f4',
                    100: '#A8D4B999',
                    200: '#A8D4B9',
                    300: '#4C9B6F29',
                    400: '#4C9B6F',
                    500: '#A8D4B9', // Main secondary color
                    600: '#569099', // Secondary accent
                    700: '#3F838E', // Secondary dark
                    800: '#14532d',
                    900: '#052e16',
                },
                surface: {
                    50: '#F5F6F9',
                    100: '#F2F2F2',
                    200: '#D9D9D9',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                },
            },
        },
    },
    plugins: [],
};