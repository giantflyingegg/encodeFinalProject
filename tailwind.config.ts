import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-blue': '#050A30',
        'medium-blue': '#0A1A40',
        'light-blue': '#0077BE',
        'accent-blue': '#5BC0EB',
        'off-white': '#F0F8FF',
        'yellowy-white': '#FFFDE7', // New color for page headings
        'creamy-off-white': '#FFF8E1', // New color for page subheadings
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

export default config