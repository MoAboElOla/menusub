/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#fdf3f4',
                    100: '#fbe4e6',
                    200: '#f7c4ca',
                    300: '#f195a1',
                    400: '#e85a6a',
                    500: '#db2638',
                    600: '#d90217', // Snoonu Red
                    700: '#b80010',
                    800: '#990412',
                    900: '#800913',
                },
            },
        },
    },
    plugins: [],
}
