import type { Metadata, Viewport } from 'next';
import './globals.css';

type Children = Readonly<{ children: React.ReactNode }>;

export const metadata: Metadata = {
  title: 'Asa Branca Barbearia',
  description: 'Agendamentos da Asa Branca Barbearia',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Children) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}
