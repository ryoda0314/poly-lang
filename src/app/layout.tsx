import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3, Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Simplified Chinese font for proper character rendering
const notoSansSC = Noto_Sans_SC({
  weight: ["400", "500", "700"],
  variable: "--font-chinese",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://polylinga.app"),
  title: {
    default: "PolyLinga - AIで語学学習を革新する",
    template: "%s | PolyLinga",
  },
  description:
    "PolyLingaは、AIを活用した革新的な語学学習アプリです。多言語対応で、あなたに最適な学習体験を提供します。今すぐ無料で始めましょう。",
  keywords: [
    "語学学習",
    "言語学習",
    "AI学習",
    "英語学習",
    "日本語学習",
    "多言語",
    "PolyLinga",
    "language learning",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PolyLinga",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "PolyLinga - AIで語学学習を革新する",
    description:
      "AIを活用した革新的な語学学習アプリ。多言語対応であなたに最適な学習体験を。",
    siteName: "PolyLinga",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "PolyLinga - AIで語学学習を革新する",
    description:
      "AIを活用した革新的な語学学習アプリ。多言語対応であなたに最適な学習体験を。",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport = {
  themeColor: "#F9F8F4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { AppProvider } from "@/store/app-context";
import SplashScreen from "@/components/SplashScreen";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PolyLinga",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web, iOS, Android",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "JPY",
  },
  description:
    "AIを活用した革新的な語学学習アプリ。多言語対応であなたに最適な学習体験を提供します。",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "100",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${playfair.variable} ${sourceSans.variable} ${notoSansSC.variable}`}>
        <AppProvider>
          <SplashScreen>
            {children}
          </SplashScreen>
        </AppProvider>
      </body>
    </html>
  );
}
