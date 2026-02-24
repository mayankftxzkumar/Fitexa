import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fitexa | AI Automation for Your Local Business",
  description: "Build, configure, and deploy AI agents for your local business. Automate replies, leads, SEO, and messaging across platforms.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-fitexa-beige text-fitexa-black min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
