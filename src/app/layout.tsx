import type { Metadata } from "next";
import { Lato, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${lato.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
