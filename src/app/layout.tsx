import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { PtahManager } from '@/components/ptah-manager';
import { OathGate } from '@/components/oath-gate';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';

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

// 👇 THE NEW VIEWPORT EXPORT
// This replaces the old <meta name="viewport"> tag
export const viewport: Viewport = {
  themeColor: "#111827", // Matches your manifest background
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 👈 CRITICAL: This stops the app from "zooming" like a website
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <PtahManager />
          <OathGate />
          <PwaInstallPrompt />
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
