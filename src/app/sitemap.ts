import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://movamais.fit";

const staticRoutes: { url: string; lastModified?: string; changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"; priority?: number }[] = [
  { url: siteUrl, changeFrequency: "daily", priority: 1 },
  { url: `${siteUrl}/sobre-nos`, changeFrequency: "monthly", priority: 0.8 },
  { url: `${siteUrl}/como-funciona`, changeFrequency: "monthly", priority: 0.9 },
  { url: `${siteUrl}/planos-precos`, changeFrequency: "weekly", priority: 0.9 },
  { url: `${siteUrl}/contato`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${siteUrl}/central-ajuda`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${siteUrl}/blog`, changeFrequency: "daily", priority: 0.9 },
  { url: `${siteUrl}/comunidade`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${siteUrl}/cookies`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${siteUrl}/lgpd`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${siteUrl}/politica-de-privacidade`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${siteUrl}/termos-de-uso`, changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let blogUrls: { url: string; lastModified: string; changeFrequency: "weekly" as const; priority: number }[] = [];

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("slug, published_at, updated_at")
        .not("published_at", "is", null)
        .lte("published_at", new Date().toISOString())
        .limit(500);

      if (posts?.length) {
        blogUrls = posts.map((post) => ({
          url: `${siteUrl}/blog/${post.slug}`,
          lastModified: (post.updated_at || post.published_at || new Date().toISOString()).split("T")[0],
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }));
      }
    } catch (e) {
      console.warn("[sitemap] Erro ao buscar posts do blog:", e);
    }
  }

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: r.url,
    lastModified: r.lastModified || new Date().toISOString().split("T")[0],
    changeFrequency: r.changeFrequency || "monthly",
    priority: r.priority ?? 0.5,
  }));

  return [...staticEntries, ...blogUrls];
}
