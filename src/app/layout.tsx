
import type { Metadata } from 'next';
import { Geist } from 'next/font/google'; // Removed Geist_Mono as it's not explicitly used in body className
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from '@/contexts/AppContext'; // Import AppProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// const geistMono = Geist_Mono({ // Commented out as not used in body className directly
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

export const metadata: Metadata = {
  title: 'WakeSync - Smart Wake Up & Home Control',
  description: 'WakeSync intelligently manages your mornings and smart home devices.',
  // Add icons if you have them
  // icons: {
  //   icon: '/favicon.ico',
  //   apple: '/apple-touch-icon.png',
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <AppProvider> {/* Wrap children with AppProvider */}
          {children}
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
