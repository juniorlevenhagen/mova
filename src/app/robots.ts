import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.movamais.fit";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/auth/", "/admin/", "/api/", "/register/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/dashboard/", "/auth/", "/admin/", "/api/", "/register/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
