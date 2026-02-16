import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClickaClick - Alfabetización Digital',
  description: 'Plataforma de alfabetización digital para adultos mayores en Perú',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
