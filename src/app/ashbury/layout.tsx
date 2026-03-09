import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "The Ashbury | Specialty Coffee - Haight Ashbury, San Francisco",
  description: "Artisanal single-origin coffees brewed with 1960s spirit and modern precision in the heart of San Francisco's most iconic neighborhood.",
};

export default function AshburyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
