import './globals.css'

export const metadata = {
  title: 'Sankasumy World',
  description: 'Meine persönliche Zentrale',
  applicationName: 'Sankasumy World',
  appleWebApp: {
    capable: true,
    title: 'Sankasumy World',
    statusBarStyle: 'default',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f5f1e8',
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
