/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                // Primary theme colors - change these to update the entire app theme
                primary: {
                    50: '#f0fdf4',
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
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#A8D4B9', // Main secondary color
                    600: '#569099', // Secondary accent
                    700: '#3F838E', // Secondary dark
                    800: '#334155',
                    900: '#1e293b',
                },
                accent: {
                    light: '#F2F2F2',
                }
            },
        },
    },
    plugins: [],
};