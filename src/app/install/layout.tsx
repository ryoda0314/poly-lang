import { Metadata } from "next";

export const metadata: Metadata = {
  title: "インストール | PolyLinga - 語学学習アプリ",
  description:
    "PolyLingaをホーム画面に追加して、いつでも快適に語学学習。iOS、Android、デスクトップに対応したPWAアプリです。",
  keywords: ["語学学習", "言語学習アプリ", "PWA", "インストール", "PolyLinga"],
  openGraph: {
    title: "インストール | PolyLinga",
    description:
      "PolyLingaをホーム画面に追加して、いつでも快適に語学学習。iOS、Android、デスクトップに対応。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "インストール | PolyLinga",
    description:
      "PolyLingaをホーム画面に追加して、いつでも快適に語学学習。",
  },
  alternates: {
    canonical: "/install",
  },
};

export default function InstallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
