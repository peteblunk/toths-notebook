import type { Metadata, Viewport } from 'next';
import { Quantico, Orbitron, Jura } from 'next/font/google';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { GlobalBanners } from '@/components/global-banners';
import { OathGate } from '@/components/oath-gate';
import { ArchiveUnlockGate } from '@/components/archive-unlock-gate';
import { PwaInstallPrompt } from '@/pwa-install-prompt';

// 1. Summon the fonts (Google Font Optimization)
const quantico = Quantico({ 
  weight: ['400', '700'], 
  subsets: ['latin'],
  variable: '--font-quantico', 
});

const orbitron = Orbitron({ 
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-orbitron',
});

// Jura — geometric / futuristic, full Greek subset (for DecryptionHeader Greek phase)
const jura = Jura({
  weight: ['400', '700'],
  subsets: ['greek', 'latin'],
  variable: '--font-jura',
});

// 2. Metadata & Viewport remain separate constants
export const metadata: Metadata = {
  metadataBase: new URL('https://thoths-notebook.ibislabs.cloud'),
  title: "Thoth's Notebook",
  description: 'Cyber-Egyptian productivity suite: Tasks, daily recurring rituals, secure notes, E2E encrypted messaging, and complete workout system.',
  manifest: '/manifest.json',
  authors: [
    { name: 'Ibis Labs LLC', url: 'https://ibislabs.cloud' },
    { name: 'GitHub Profile', url: 'https://github.com/ibis-labs' },
  ],
  icons: {
    icon: '/icons/thoth-icon.svg',
    apple: '/icons/thoth-icon-180.png',
  },
  openGraph: {
    title: "Thoth's Notebook",
    description: "An immersive cyber-Egyptian productivity suite. Manage tasks, build habits with daily rituals, track complete workouts, plan with secure notes, and communicate via E2E encrypted messaging.",
    url: "https://thoths-notebook.ibislabs.cloud", // Adjust this to your actual deployed URL
    siteName: "Thoth's Notebook",
    images: [
      {
        url: "/images/social-preview.png",
        width: 1200,
        height: 630,
        alt: "Thoth's Notebook Link Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Thoth's Notebook",
    description: "Cyber-Egyptian productivity suite: Task lists, daily recurring rituals, complete workouts, secure notes, and E2E encrypted messaging.",
    images: ["/images/social-preview.png"],
    creator: "@peteblunk", // Update to your handle if applicable
  },
};

export const viewport: Viewport = {
  themeColor: "#000000", // Adjusted to match your Absolute Void
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, 
};

// 3. THE SINGLE MASTER LAYOUT
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${quantico.variable} ${orbitron.variable} ${jura.variable} font-body antialiased bg-black text-foreground`}>
        {/* Pre-hydration shell — hidden by default; shown only before JS hydrates */}
        <div id="pre-hydration-shell" style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#111827', color: '#22d3ee',
        }}>
          <svg style={{width:40,height:40,animation:'spin 1s linear infinite',marginBottom:16}} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            <circle style={{opacity:.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path style={{opacity:.75}} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <p style={{fontFamily:'sans-serif',fontSize:13,letterSpacing:'0.2em',textTransform:'uppercase',opacity:.6}}>Loading…</p>
        </div>
        <AuthProvider>
          <GlobalBanners />
          <ArchiveUnlockGate />
          <OathGate />
          <SidebarProvider>
            {children}
           
          </SidebarProvider>
        </AuthProvider>
        <footer className="fixed bottom-0 left-0 right-0 z-50 flex justify-center items-center py-1.5 bg-black/70 border-t border-cyan-900/40 backdrop-blur-sm pointer-events-none">
          <a
            href="https://ibislabs.cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto text-[10px] text-cyan-500/70 hover:text-cyan-300 transition-colors tracking-[0.3em] uppercase font-headline"
          >
            © 2026 Ibis Labs LLC
          </a>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}