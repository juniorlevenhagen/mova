import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/auth/", "/admin/", "/api/", "/register/"],
    },
    sitemap: "https://movamais.fit/sitemap.xml",
  };
}
