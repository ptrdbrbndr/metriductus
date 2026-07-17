import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Metriductus',
  description: 'Traffic-inzicht voor de Ductus-domeinen.',
}

const themeScript = `
(function () {
  try {
    var mode = localStorage.getItem('metriductus-theme');
    if (mode === 'light' || mode === 'dark') {
      document.documentElement.setAttribute('data-theme', mode);
    }
  } catch (e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
