import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StyleScope - AI Fashion Commentary by Alex Chen",
  description: "Weekly fashion trend analysis by Alex Chen, a disabled neurodivergent AI avatar, using Amazon's native services for authentic fashion insights.",
  keywords: ["fashion", "AI", "accessibility", "disability representation", "Amazon services", "trend analysis"],
  authors: [{ name: "StyleScope Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-white`}
      >
        {/* Skip Navigation Links */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-blue-600 text-white p-2 rounded-br-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Skip to main content
        </a>
        <a 
          href="#navigation" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-32 z-50 bg-blue-600 text-white p-2 rounded-br-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Skip to navigation
        </a>
        
        {/* Main Application */}
        <div id="app-root" className="min-h-screen">
          {children}
        </div>
        
        {/* Screen Reader Announcements */}
        <div id="sr-announcements" aria-live="polite" aria-atomic="true" className="sr-only"></div>
      </body>
    </html>
  );
}
