import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fitexa | Where Fitness Businesses Grow with AI",
  description: "Fitexa.in is your AI-powered front desk and growth engine. Automate leads, bookings, follow-ups, reviews, and visibility — all controlled from Telegram.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased bg-fitexa-black text-fitexa-beige min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
