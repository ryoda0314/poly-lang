import type { NativeLanguage } from "@/lib/translations";

export function detectBrowserLanguage(): NativeLanguage {
  if (typeof window === "undefined") return "en";
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("ja")) return "ja";
  if (browserLang.startsWith("ko")) return "ko";
  if (browserLang.startsWith("zh")) return "zh";
  if (browserLang.startsWith("fr")) return "fr";
  if (browserLang.startsWith("es")) return "es";
  if (browserLang.startsWith("de")) return "de";
  if (browserLang.startsWith("ru")) return "ru";
  if (browserLang.startsWith("vi")) return "vi";
  if (browserLang.startsWith("fi")) return "fi";
  return "en";
}

export type InAppBrowser =
  | "instagram" | "twitter" | "line" | "facebook"
  | "tiktok" | "wechat" | null;

export function detectInAppBrowser(): InAppBrowser {
  if (typeof window === "undefined") return null;
  const ua = navigator.userAgent;
  if (/Instagram/i.test(ua)) return "instagram";
  if (/Twitter/i.test(ua)) return "twitter";
  if (/\bLine\//i.test(ua)) return "line";
  if (/FBAN|FBAV/i.test(ua)) return "facebook";
  if (/TikTok/i.test(ua)) return "tiktok";
  if (/MicroMessenger/i.test(ua)) return "wechat";
  return null;
}
