import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://polylinga.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/install", "/login", "/register"],
        disallow: ["/app/", "/admin/", "/api/", "/auth/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
