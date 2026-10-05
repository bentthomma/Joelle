import './globals.css'

export const metadata = {
  title: 'Sankasumy World',
  description: 'Meine persönliche Zentrale',
  applicationName: 'Sankasumy World',
  appleWebApp: {
    capable: true,
    title: 'Sankasumy World',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#08100d',
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
