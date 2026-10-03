export const metadata = {
  title: 'CenterInsider | The Anonymous Voting App for Bathinda Hubs',
  description: 'Stop guessing. Start knowing. CenterInsider is the 100% anonymous school voting network for 11th, 12th, and dropper coaching students in Bathinda.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.ico' }
    ],
    shortcut: ['/favicon.ico'],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' }
    ]
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
