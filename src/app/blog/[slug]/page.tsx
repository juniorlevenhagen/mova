import { Metadata } from "next";
import { notFound } from "next/navigation";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { supabase } from "@/lib/supabase";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";
import Link from "next/link";

type SupabasePost = {
  id: string | number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | string[] | null;
  author?: string | null;
  category?: string | null;
  read_time?: string | null;
  readTime?: string | null;
  cover_image?: string | null;
  coverImage?: string | null;
  published_at?: string | null;
  publishedAt?: string | null;
  key_takeaways?: string[] | null;
  keyTakeaways?: string[] | null;
  sections?: Array<{ heading?: string; body?: string } | null> | null;
  highlighted_quote?: { text?: string; author?: string } | null;
};

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  category: string;
  readTime: string;
  coverImage?: string;
  publishedAt?: string;
  content: string[];
  sections: Array<{ heading?: string; body?: string }>;
  keyTakeaways: string[];
  highlightedQuote?: { text?: string; author?: string };
};

const fallbackPosts: Record<string, BlogPost> = {
  "como-comecar-uma-rotina-de-exercicios-em-casa": {
    id: "1",
    title: "Como Começar uma Rotina de Exercícios em Casa",
    slug: "como-comecar-uma-rotina-de-exercicios-em-casa",
    excerpt:
      "Estruture seus treinos com métodos eficientes, sem equipamentos caros e com resultados consistentes.",
    author: "Dr. Ana Silva",
    category: "Treino",
    readTime: "5 min",
    publishedAt: "2024-01-15",
    coverImage: undefined,
    content: [
      "Criar uma rotina de exercícios em casa exige clareza sobre o seu objetivo, o tempo disponível e os recursos que você tem em mãos.",
      "Comece definindo três sessões semanais com foco em movimentos multiarticulares, trabalhando empurrar, puxar e membros inferiores.",
      "Utilize o peso do corpo, faixas elásticas ou objetos domésticos para construir resistência progressiva.",
      "Finalize cada sessão com um bloco de mobilidade e respiração para acelerar a recuperação e reduzir o estresse.",
    ],
    sections: [
      {
        heading: "Organize sua semana",
        body: "Distribua treinos de força, condicionamento e mobilidade ao longo da semana. Reserve ao menos um dia para descanso ativo, como caminhadas ou alongamentos leves.",
      },
      {
        heading: "Monte mini circuitos",
        body: "Agrupe exercícios em blocos de 3 a 4 movimentos (ex.: agachamento, flexão, prancha). Trabalhe 3 séries de 45 segundos cada com 15 segundos de descanso entre eles.",
      },
      {
        heading: "Reforce hábitos",
        body: "Crie gatilhos ambientais: deixe tapete de treino visível, programe alarmes e registre seus treinos no app do Mova+ para acompanhar evolução.",
      },
    ],
    keyTakeaways: [
      "Planeje movimentos multiarticulares para maximizar resultados com o tempo disponível.",
      "Estabeleça progressões simples: aumente repetições, tempo sob tensão ou reduza intervalos.",
      "Combine treino, hidratação e sono para acelerar adaptações.",
    ],
  },
  "alimentos-essenciais-para-ganho-de-massa-muscular": {
    id: "2",
    title: "Os 10 Alimentos Essenciais para Ganho de Massa Muscular",
    slug: "alimentos-essenciais-para-ganho-de-massa-muscular",
    excerpt:
      "Conheça os alimentos que garantem aporte nutricional completo para construir massa magra com saúde.",
    author: "Marina Costa",
    category: "Nutrição",
    readTime: "7 min",
    publishedAt: "2024-01-12",
    coverImage: undefined,
    content: [
      "Um plano alimentar para hipertrofia depende da combinação entre proteína de alto valor biológico, carboidratos complexos e gorduras de qualidade.",
      "Distribua a ingestão proteica ao longo do dia, buscando de 0,25 g a 0,4 g de proteína por quilo de peso corporal por refeição.",
      "Inclua alimentos ricos em micronutrientes que preservam a saúde hormonal e a recuperação muscular.",
    ],
    sections: [
      {
        heading: "Bases proteicas",
        body: "Ovos, peito de frango, peixes, cortes magros de carne bovina e tofu oferecem o balanço ideal entre aminoácidos essenciais e digestibilidade.",
      },
      {
        heading: "Carboidratos estratégicos",
        body: "Batata-doce, arroz integral, aveia e quinoa mantêm níveis de energia estáveis e ajudam na síntese de glicogênio pós-treino.",
      },
      {
        heading: "Gorduras inteligentes",
        body: "Abacate, castanhas, azeite de oliva extra virgem e sementes fortalecem a saúde hormonal e reduzem inflamações.",
      },
    ],
    keyTakeaways: [
      "Divida proteína de qualidade em 4 a 5 refeições diárias.",
      "Priorize carboidratos complexos em torno dos treinos para performance e recuperação.",
      "Inclua gorduras boas e micronutrientes para suporte hormonal e imunidade.",
    ],
  },
};

function normalizePost(data: SupabasePost): BlogPost | null {
  if (!data || !data.slug || !data.title) return null;

  const content = Array.isArray(data.content)
    ? data.content.filter((paragraph): paragraph is string =>
        Boolean(paragraph)
      )
    : typeof data.content === "string"
      ? data.content
          .split(/\n{2,}/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean)
      : [];

  const sections = Array.isArray(data.sections)
    ? data.sections
        .filter((section): section is { heading?: string; body?: string } =>
          Boolean(section)
        )
        .map((section) => ({
          heading: section.heading ?? undefined,
          body: section.body ?? undefined,
        }))
    : [];

  const keyTakeaways = Array.isArray(data.keyTakeaways)
    ? data.keyTakeaways.filter((item): item is string => Boolean(item))
    : Array.isArray(data.key_takeaways)
      ? data.key_takeaways.filter((item): item is string => Boolean(item))
      : [];

  return {
    id: String(data.id ?? `fallback-${data.slug}`),
    title: data.title,
    slug: data.slug,
    excerpt:
      data.excerpt?.trim() ??
      "Conteúdo exclusivo elaborado pelo time Mova+ para impulsionar sua evolução.",
    author: data.author?.trim() ?? "Equipe Mova+",
    category: data.category?.trim() ?? "Conteúdo",
    readTime: data.readTime?.trim() ?? data.read_time?.trim() ?? "",
    coverImage: data.coverImage ?? data.cover_image ?? undefined,
    publishedAt: data.publishedAt ?? data.published_at ?? undefined,
    content,
    sections,
    keyTakeaways,
    highlightedQuote: data.highlighted_quote ?? undefined,
  };
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        `id, slug, title, excerpt, content, author, category, read_time, cover_image, published_at, key_takeaways, sections, highlighted_quote`
      )
      .eq("slug", slug)
      .maybeSingle<SupabasePost>();

    if (error) {
      console.warn("Erro ao buscar post no Supabase", error);
      return null;
    }

    if (!data) return null;

    return normalizePost(data);
  } catch (err) {
    console.error("Falha inesperada ao carregar post", err);
    return null;
  }
}

function formatDate(date?: string) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

type PageParams = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const post = (await getPost(slug)) ?? fallbackPosts[slug];

  if (!post) {
    return {
      title: "Artigo não encontrado | Blog Mova+",
    };
  }

  return {
    title: `${post.title} | Blog Mova+`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      ...(post.coverImage && {
        images: [
          {
            url: post.coverImage,
            alt: post.title,
          },
        ],
      }),
    },
  };
}

export default async function BlogPostPage({ params }: PageParams) {
  const { slug } = await params;
  const post = (await getPost(slug)) ?? fallbackPosts[slug];

  if (!post) {
    return notFound();
  }

  const publishedLabel = formatDate(post.publishedAt);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-100">
      <Navbar />

      <article>
        <section className="relative overflow-hidden border-b border-black/5">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gradient-to-r from-gray-200 via-white to-gray-200 blur-3xl" />
            <div className="absolute bottom-[-8rem] right-[-6rem] h-64 w-64 rounded-full bg-gradient-to-br from-gray-200 via-white to-gray-50 blur-3xl" />
          </div>

          <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 pb-24 pt-20 text-center">
            <div className="mb-6 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">
              <span className="rounded-full border border-black/10 px-4 py-1">
                {post.category}
              </span>
              {post.readTime && (
                <span className="rounded-full border border-black/10 px-4 py-1">
                  {post.readTime}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-zalando-medium text-black sm:text-5xl">
              {post.title}
            </h1>

            <p className="mt-6 max-w-2xl text-base text-gray-600 sm:text-lg">
              {post.excerpt}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-[0.3em] text-gray-500">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {post.author}
              </span>
              {publishedLabel && (
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {publishedLabel}
                </span>
              )}
              {post.readTime && (
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="px-4 py-20">
          <div className="mx-auto flex max-w-5xl flex-col gap-14 lg:flex-row">
            <div className="flex-1 space-y-10 text-lg leading-relaxed text-black/80">
              {post.content.length > 0 && (
                <div className="space-y-6">
                  {post.content.map((paragraph, index) => (
                    <p key={`paragraph-${index}`} className="text-gray-700">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}

              {post.sections.length > 0 && (
                <div className="space-y-12">
                  {post.sections.map((section, index) => (
                    <div key={`section-${index}`} className="space-y-4">
                      {section.heading && (
                        <h2 className="text-2xl font-zalando-medium text-black">
                          {section.heading}
                        </h2>
                      )}
                      {section.body && (
                        <p className="text-gray-700">{section.body}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {post.highlightedQuote?.text && (
                <blockquote className="rounded-[24px] border-2 border-black bg-white p-8 text-center text-xl font-medium text-black shadow-[0_25px_60px_-40px_rgba(0,0,0,0.45)]">
                  <p className="mb-4">“{post.highlightedQuote.text}”</p>
                  {post.highlightedQuote.author && (
                    <footer className="text-sm uppercase tracking-[0.3em] text-gray-500">
                      {post.highlightedQuote.author}
                    </footer>
                  )}
                </blockquote>
              )}
            </div>

            <aside className="w-full max-w-md self-start rounded-[28px] border-2 border-black bg-white p-8 shadow-[0_20px_70px_-40px_rgba(0,0,0,0.45)]">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
                    Principais insights
                  </h3>
                  {post.keyTakeaways.length > 0 ? (
                    <ul className="space-y-3 text-sm text-gray-700">
                      {post.keyTakeaways.map((item, index) => (
                        <li key={`takeaway-${index}`} className="flex gap-3">
                          <span className="mt-1 inline-block h-2 w-2 rounded-full bg-black" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Atualize o campo `key_takeaways` no Supabase para destacar
                      os aprendizados-chave deste artigo.
                    </p>
                  )}
                </div>

                <div className="space-y-4 border-t border-dashed border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">
                    Continue a leitura
                  </h3>
                  <div className="space-y-3">
                    <Link
                      href="/blog"
                      className="group inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-black transition hover:text-gray-700"
                    >
                      Voltar para o blog
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </Link>
                    <p className="text-xs text-gray-500">
                      Este layout busca dados da tabela `blog_posts` no
                      Supabase. Configure campos como cover image, conteúdo e
                      tópicos para enriquecer o artigo.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </article>

      <Footer />
    </div>
  );
}
