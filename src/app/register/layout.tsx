import { Metadata } from "next";

export const metadata: Metadata = {
  title: "新規登録 | PolyLinga - 語学学習アプリ",
  description:
    "PolyLingaに無料登録して、AIを活用した革新的な語学学習を始めましょう。多言語対応で、あなたに最適な学習体験を提供します。",
  keywords: [
    "新規登録",
    "無料",
    "語学学習",
    "言語学習アプリ",
    "PolyLinga",
    "AI学習",
  ],
  openGraph: {
    title: "新規登録 | PolyLinga",
    description:
      "PolyLingaに無料登録して、AIを活用した革新的な語学学習を始めましょう。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "新規登録 | PolyLinga",
    description:
      "PolyLingaに無料登録して、AIを活用した革新的な語学学習を始めましょう。",
  },
  alternates: {
    canonical: "/register",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
