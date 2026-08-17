import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "BlakNet — Built for Black Business. Built for Opportunity.",
  description:
    "BlakNet is the platform helping Black-owned businesses get discovered, connected and opportunity-ready. Get Exposed. Get Connected. Get Ready.",
  keywords: [
    "BlakNet",
    "Black-owned business",
    "South Africa business directory",
    "B-BBEE",
    "business network",
    "entrepreneurs",
    "SaaS",
  ],
  authors: [{ name: "BlakNet" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "BlakNet — Built for Black Business. Built for Opportunity.",
    description:
      "The platform helping Black-owned businesses get discovered, connected and opportunity-ready.",
    siteName: "BlakNet",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlakNet",
    description:
      "Built for Black Business. Built for Opportunity. Get Exposed. Get Connected. Get Ready.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
