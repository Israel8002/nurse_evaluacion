import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'Evaluación Anual de Enfermería',
  description: 'Sistema Web de Evaluación Anual del Personal de Enfermería',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
