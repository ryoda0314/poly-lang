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
  if (browserLang.startsWith("cs")) return "cs";
  return "en";
}

export type InAppBrowser =
  | "instagram" | "twitter" | "line" | "facebook"
  | "tiktok" | "wechat" | "hellotalk" | "kakaotalk"
  | "snapchat" | "pinterest" | "linkedin" | "whatsapp"
  | "telegram" | "discord" | "slack" | "naver"
  | "webview" // generic fallback
  | null;

export function detectInAppBrowser(): InAppBrowser {
  if (typeof window === "undefined") return null;
  const ua = navigator.userAgent;

  // Known apps
  if (/Instagram/i.test(ua)) return "instagram";
  if (/Twitter/i.test(ua)) return "twitter";
  if (/\bLine\//i.test(ua)) return "line";
  if (/FBAN|FBAV/i.test(ua)) return "facebook";
  if (/TikTok/i.test(ua)) return "tiktok";
  if (/MicroMessenger/i.test(ua)) return "wechat";
  if (/HelloTalk/i.test(ua)) return "hellotalk";
  if (/KAKAOTALK/i.test(ua)) return "kakaotalk";
  if (/Snapchat/i.test(ua)) return "snapchat";
  if (/Pinterest/i.test(ua)) return "pinterest";
  if (/LinkedInApp/i.test(ua)) return "linkedin";
  if (/WhatsApp/i.test(ua)) return "whatsapp";
  if (/TelegramBot|Telegram/i.test(ua)) return "telegram";
  if (/Discord/i.test(ua)) return "discord";
  if (/Slack/i.test(ua)) return "slack";
  if (/NAVER/i.test(ua)) return "naver";

  // Generic WebView detection (catch-all for unknown in-app browsers)
  // Android WebView: contains "wv)" in the version string
  if (/\bwv\b/.test(ua)) return "webview";
  // iOS: has iPhone/iPad but no "Safari/" in UA (WKWebView omits it)
  if (/iPhone|iPad|iPod/i.test(ua) && !/Safari\//i.test(ua)) return "webview";
  // Android: has "Android" but no "Chrome/" (or has "Version/X.X Chrome/" which is WebView)
  if (/Android/i.test(ua) && /Version\/[\d.]+/.test(ua) && /Chrome\//i.test(ua)) return "webview";

  return null;
}

/** Returns true when running inside a Capacitor native shell */
export function isCapacitorApp(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}
