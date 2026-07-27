import './globals.css'

export const metadata = {
  title: 'Administración | Ricardo Navarro',
  description: 'Panel de administración del portafolio de Ricardo Navarro.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  )
}
