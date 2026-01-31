import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログイン | PolyLinga - 語学学習アプリ",
  description:
    "PolyLingaにログインして、あなたの語学学習を続けましょう。AIを活用した革新的な言語学習体験をお楽しみください。",
  keywords: ["ログイン", "語学学習", "言語学習アプリ", "PolyLinga", "サインイン"],
  openGraph: {
    title: "ログイン | PolyLinga",
    description:
      "PolyLingaにログインして、あなたの語学学習を続けましょう。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "ログイン | PolyLinga",
    description:
      "PolyLingaにログインして、あなたの語学学習を続けましょう。",
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
