export default function manifest() {
  return {
    name: 'Sankasumy World',
    short_name: 'Sankasumy',
    description: 'Meine persönliche Zentrale',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f1e8',
    theme_color: '#f5f1e8',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
    ]
  }
}
