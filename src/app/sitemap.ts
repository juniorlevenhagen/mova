import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const revalidate = 0;
export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.movamais.fit";

const staticRoutes = [
  { url: siteUrl, changeFrequency: "daily", priority: 1 },
  { url: `${siteUrl}/sobre-nos`, changeFrequency: "monthly", priority: 0.8 },
  {
    url: `${siteUrl}/como-funciona`,
    changeFrequency: "monthly",
    priority: 0.9,
  },
  { url: `${siteUrl}/planos-precos`, changeFrequency: "weekly", priority: 0.9 },
  { url: `${siteUrl}/contato`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${siteUrl}/central-ajuda`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${siteUrl}/blog`, changeFrequency: "daily", priority: 0.9 },
  { url: `${siteUrl}/comunidade`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${siteUrl}/cookies`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${siteUrl}/lgpd`, changeFrequency: "yearly", priority: 0.3 },
  {
    url: `${siteUrl}/politica-de-privacidade`,
    changeFrequency: "yearly",
    priority: 0.3,
  },
  { url: `${siteUrl}/termos-de-uso`, changeFrequency: "yearly", priority: 0.3 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: route.url,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

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
        posts.forEach((post) => {
          entries.push({
            url: `${siteUrl}/blog/${post.slug}`,
            lastModified: new Date(post.updated_at || post.published_at),
            changeFrequency: "weekly",
            priority: 0.8,
          });
        });
      }
    } catch (error) {
      console.warn("[sitemap] Erro ao buscar posts do blog:", error);
    }
  }

  return entries; // 🔥 sempre retorna
}
