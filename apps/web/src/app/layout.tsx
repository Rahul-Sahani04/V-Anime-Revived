import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { Navbar } from "@/components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "V-Anime Revived | Next-Gen Anime Streaming",
    template: "%s | V-Anime Revived",
  },
  description: "Modern Anime Streaming with HD playback, zero ads, multi-server fallback, and AniList sync.",
  openGraph: {
    title: "V-Anime Revived",
    description: "Modern Anime Streaming with HD playback, zero ads, and AniList sync.",
    siteName: "V-Anime Revived",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "V-Anime Revived",
    description: "Modern Anime Streaming with HD playback, zero ads, and AniList sync.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <ConvexClientProvider>
          <Navbar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
