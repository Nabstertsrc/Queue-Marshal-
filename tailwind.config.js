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
                    DEFAULT: '#00D26A',
                    '50': '#E6FFF2',
                    '100': '#B3FFD9',
                    '200': '#80FFBF',
                    '300': '#4DFFA6',
                    '400': '#1AFF8C',
                    '500': '#00D26A',
                    '600': '#00B35A',
                    '700': '#009149',
                    '800': '#006F38',
                    '900': '#004D27',
                    '950': '#002B16'
                },
                dark: {
                    DEFAULT: '#0D0D0D',
                    '50': '#F5F5F5',
                    '100': '#E0E0E0',
                    '200': '#B3B3B3',
                    '300': '#808080',
                    '400': '#4D4D4D',
                    '500': '#333333',
                    '600': '#262626',
                    '700': '#1A1A1A',
                    '800': '#141414',
                    '900': '#0D0D0D',
                    '950': '#050505',
                },
                accent: '#00D26A',
                secondary: '#0D0D0D',
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
