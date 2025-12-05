import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { PtahManager } from '@/components/ptah-manager';
import { OathGate } from '@/components/oath-gate';

export const metadata: Metadata = {
  title: "Thoth's Notebook",
  description: 'Manage your tasks with the wisdom of the ancients.',

  // This line tells the browser where to find your app's manifest
  manifest: '/manifest.json',

  // --- Author & Profile Links ---
  // This section helps search engines and other services identify the creator.
  authors: [
    { name: 'Pete Blunk', url: 'https://unclepetelaboratories.net' },
    { name: 'GitHub Profile', url: 'https://github.com/peteblunk' },
  ],

  // --- Favicon and App Icons ---
  icons: {
    icon: '/icons/thoth-icon.svg', // For browser tabs
    shortcut: '/icons/thoth-icon-180.png', // For bookmarks
    apple: '/icons/thoth-icon-180.png', // For "Add to Home Screen" on iOS
  },

  // --- Social Media Preview (Open Graph) ---
  openGraph: {
    title: "Thoth's Notebook",
    description: 'Your Cyber-Egyptian Task Manager. Manage tasks with the wisdom of the ancients.',
    url: 'https://thoths-notebook.unclepetelaboratories.net/', // Your actual URL
    siteName: "Thoth's Notebook",
    images: [
      {
        url: '/images/social-preview.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* The manifest link is now handled by the metadata object above! */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <PtahManager />
          <OathGate />
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
