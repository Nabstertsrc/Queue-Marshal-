/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
        "!./node_modules/**",
        "!./server/**",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            colors: {
                primary: {
                    DEFAULT: 'rgb(var(--color-primary-500) / <alpha-value>)',
                    '50': '#E6FFF2',
                    '100': '#B3FFD9',
                    '200': '#80FFBF',
                    '300': '#4DFFA6',
                    '400': 'rgb(var(--color-primary-400) / <alpha-value>)',
                    '500': 'rgb(var(--color-primary-500) / <alpha-value>)',
                    '600': '#00B35A',
                    '700': '#009149',
                    '800': '#006F38',
                    '900': '#004D27',
                    '950': '#002B16'
                },
                dark: {
                    DEFAULT: 'rgb(var(--color-dark-900) / <alpha-value>)',
                    '50': 'rgb(var(--color-dark-50) / <alpha-value>)',
                    '100': 'rgb(var(--color-dark-100) / <alpha-value>)',
                    '200': 'rgb(var(--color-dark-200) / <alpha-value>)',
                    '300': 'rgb(var(--color-dark-300) / <alpha-value>)',
                    '400': 'rgb(var(--color-dark-400) / <alpha-value>)',
                    '500': 'rgb(var(--color-dark-500) / <alpha-value>)',
                    '600': 'rgb(var(--color-dark-600) / <alpha-value>)',
                    '700': 'rgb(var(--color-dark-700) / <alpha-value>)',
                    '800': 'rgb(var(--color-dark-800) / <alpha-value>)',
                    '900': 'rgb(var(--color-dark-900) / <alpha-value>)',
                    '950': 'rgb(var(--color-dark-950) / <alpha-value>)',
                },
                white: 'rgb(var(--color-white) / <alpha-value>)',
                black: 'rgb(var(--color-black) / <alpha-value>)',
                accent: 'rgb(var(--color-primary-500) / <alpha-value>)',
                secondary: 'rgb(var(--color-dark-900) / <alpha-value>)',
            },
            backgroundImage: {
                'app-gradient': 'var(--app-gradient)',
            },
            borderRadius: {
                'lg': 'var(--radius-main)',
                'xl': 'var(--radius-main)',
                '2xl': 'var(--radius-main)',
                '3xl': 'var(--radius-main)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'pulse-ring': 'pulseRing 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                pulseRing: {
                    '0%': { transform: 'scale(0.33)' },
                    '80%, 100%': { opacity: '0' },
                },
            },
        },
    },
    plugins: [],
}
