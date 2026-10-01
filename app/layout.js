export const metadata = {
  title: 'CenterInsider | The Anonymous Voting App for Bathinda Hubs',
  description: 'Stop guessing. Start knowing. CenterInsider is the 100% anonymous school voting network for 11th, 12th, and dropper coaching students in Bathinda.',
  icons: {
    icon: [
      { url: '/favicon.ico?v=2' },
      { url: '/favicon-96x96.png?v=2', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg?v=2', type: 'image/svg+xml' }
    ],
    shortcut: ['/favicon.ico?v=2'],
    apple: [
      { url: '/apple-touch-icon.png?v=2', sizes: '180x180' }
    ]
  },
  manifest: '/site.webmanifest?v=2',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
