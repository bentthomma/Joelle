export default function manifest() {
  return {
    name: 'Sankasumy World',
    short_name: 'Sankasumy',
    description: 'Meine persönliche Zentrale',
    start_url: '/',
    display: 'standalone',
    background_color: '#08100d',
    theme_color: '#08100d',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
    ]
  }
}
