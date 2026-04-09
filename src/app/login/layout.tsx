import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログイン",
  description:
    "PolyLingaにログインして学習を再開。発音・会話・文法など、あなたの進捗の続きから始められます。",
  keywords: ["ログイン", "語学学習", "言語学習アプリ", "PolyLinga", "サインイン"],
  openGraph: {
    title: "ログイン | PolyLinga",
    description:
      "PolyLingaにログインして学習を再開。発音・会話・文法など、あなたの進捗の続きから始められます。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "ログイン | PolyLinga",
    description:
      "PolyLingaにログインして学習を再開。発音・会話・文法など、あなたの進捗の続きから始められます。",
  },
  alternates: {
    canonical: "/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
