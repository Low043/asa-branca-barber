type Children = Readonly<{ children: React.ReactNode }>;

export default function RootLayout({ children }: Children) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}
