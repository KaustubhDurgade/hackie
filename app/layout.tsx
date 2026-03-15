import type { Metadata } from "next";
import { Inter, Syne, Lora } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hackie.app';

export const metadata: Metadata = {
  title:       { default: 'hackie', template: '%s · hackie' },
  description: 'AI-powered hackathon co-pilot. From idea to codebase in 24 hours.',
  metadataBase: new URL(APP_URL),
  openGraph: {
    title:       'hackie — AI hackathon co-pilot',
    description: 'From "we have 24 hours" to a validated idea, architecture diagram, and working boilerplate.',
    url:          APP_URL,
    siteName:    'hackie',
    type:        'website',
    locale:      'en_US',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'hackie — AI hackathon co-pilot',
    description: 'From "we have 24 hours" to a validated idea, architecture, and boilerplate.',
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body suppressHydrationWarning className={`${inter.variable} ${syne.variable} ${lora.variable} antialiased`}>
          {children}
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        </body>
      </html>
    </ClerkProvider>
  );
}
