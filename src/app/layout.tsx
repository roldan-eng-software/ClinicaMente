import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "ClínicaMente - Software de gestão para psicólogos",
    template: "%s | ClínicaMente",
  },
  description:
    "ClínicaMente é um software de gestão para psicólogos e consultórios de psicologia, com agenda online, prontuário eletrônico, finanças e lembretes automáticos em um só lugar.",
  keywords: [
    "software para psicólogos",
    "gestão para psicólogos",
    "plataforma para clínica de psicologia",
    "agenda online psicologia",
    "prontuário eletrônico psicologia",
    "sistema para consultório de psicologia",
    "ClínicaMente",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    title: "ClínicaMente - Software de gestão para psicólogos",
    description:
      "Centralize agenda, prontuários, finanças e lembretes automáticos em uma plataforma feita para psicólogos.",
    siteName: "ClínicaMente",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClínicaMente - Software de gestão para psicólogos",
    description:
      "Agenda online, prontuários seguros e finanças organizadas em um só lugar.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}

        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <Script
            id="adsense-init"
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
          />
        )}
      </body>
    </html>
  );
}
