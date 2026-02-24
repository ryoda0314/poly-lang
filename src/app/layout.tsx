import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3, Noto_Sans_SC, Noto_Sans, Noto_Sans_Thai_Looped, Noto_Sans_Arabic, Noto_Sans_KR } from "next/font/google";
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

// IPA & universal script support (incl. Cyrillic, Devanagari)
const notoSans = Noto_Sans({
  subsets: ["latin", "latin-ext", "cyrillic", "devanagari"],
  weight: ["400", "500", "600"],
  variable: "--font-ipa",
  display: "swap",
  preload: false,
});

// Thai script (looped variant — traditional style with loops)
const notoSansThai = Noto_Sans_Thai_Looped({
  weight: ["400", "500", "600"],
  variable: "--font-thai",
  display: "swap",
  preload: false,
});

// Arabic script
const notoSansArabic = Noto_Sans_Arabic({
  weight: ["400", "500", "600"],
  variable: "--font-arabic",
  display: "swap",
  preload: false,
});

// Korean script
const notoSansKR = Noto_Sans_KR({
  weight: ["400", "500", "700"],
  variable: "--font-korean",
  display: "swap",
  preload: false,
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
    default: "PolyLinga | 生成AIの語学学習アプリ",
    template: "%s | PolyLinga",
  },
  description:
    "生成AIが発音・文法・語彙・会話・添削など多彩な学習をサポートする多言語対応の語学アプリです。",
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
    title: "PolyLinga | 生成AIの語学学習アプリ",
    description:
      "生成AIが発音・文法・語彙・会話・添削など多彩な学習をサポートする多言語対応の語学アプリです。",
    siteName: "PolyLinga",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "PolyLinga | 生成AIの語学学習アプリ",
    description:
      "生成AIが発音・文法・語彙・会話・添削など多彩な学習をサポートする多言語対応の語学アプリです。",
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

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://polylinga.app";

const jsonLd = [
  {
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
      "生成AIが発音・文法・語彙・会話・添削など多彩な学習をサポートする多言語対応の語学アプリです。",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "100",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PolyLinga",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/app?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: "メインナビゲーション",
    hasPart: [
      { "@type": "WebPage", name: "ログイン", url: `${baseUrl}/login` },
      { "@type": "WebPage", name: "新規登録", url: `${baseUrl}/register` },
      { "@type": "WebPage", name: "インストール", url: `${baseUrl}/install` },
      { "@type": "WebPage", name: "利用規約", url: `${baseUrl}/terms` },
      { "@type": "WebPage", name: "プライバシーポリシー", url: `${baseUrl}/privacy` },
    ],
  },
];

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
      <body className={`${playfair.variable} ${sourceSans.variable} ${notoSansSC.variable} ${notoSans.variable} ${notoSansThai.variable} ${notoSansArabic.variable} ${notoSansKR.variable}`}>
        <AppProvider>
          <SplashScreen>
            {children}
          </SplashScreen>
        </AppProvider>
      </body>
    </html>
  );
}
