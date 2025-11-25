"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Calendar, User, ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  date: string;
  dateISO: string; // Para ordenação (published_at)
  createdISO?: string; // Para ordenação secundária (created_at)
  category: string;
  readTime: string;
  featured: boolean;
  accentGradient: string;
};

// Cores alegres e vibrantes para a barra de gradiente no topo dos cards
const gradientMap: Record<string, string> = {
  Treino: "from-blue-400 via-indigo-500 to-purple-600",
  Nutrição: "from-emerald-400 via-teal-500 to-cyan-600",
  Motivação: "from-orange-300 via-amber-400 to-yellow-500",
  Recuperação: "from-violet-400 via-purple-500 to-fuchsia-600",
  Mindset: "from-rose-400 via-pink-500 to-red-500",
};

// Cores vibrantes para hover dos cards baseadas na categoria
const hoverColorsMap: Record<string, string> = {
  Treino:
    "hover:bg-gradient-to-br hover:from-blue-600 hover:via-indigo-700 hover:to-purple-800",
  Nutrição:
    "hover:bg-gradient-to-br hover:from-emerald-600 hover:via-teal-700 hover:to-cyan-800",
  Motivação:
    "hover:bg-gradient-to-br hover:from-orange-500 hover:via-amber-600 hover:to-yellow-600",
  Recuperação:
    "hover:bg-gradient-to-br hover:from-violet-600 hover:via-purple-700 hover:to-fuchsia-800",
  Mindset:
    "hover:bg-gradient-to-br hover:from-rose-600 hover:via-pink-700 hover:to-red-700",
};

// Cores de borda alegres para os cards
const borderColorsMap: Record<string, string> = {
  Treino: "border-indigo-400",
  Nutrição: "border-emerald-400",
  Motivação: "border-amber-400",
  Recuperação: "border-purple-400",
  Mindset: "border-rose-400",
};

const getGradientForCategory = (category: string | null): string => {
  return category && gradientMap[category]
    ? gradientMap[category]
    : "from-slate-200 via-white to-slate-50";
};

const getHoverColorForCategory = (category: string | null): string => {
  return category && hoverColorsMap[category]
    ? hoverColorsMap[category]
    : "hover:bg-gradient-to-br hover:from-gray-900 hover:via-gray-800 hover:to-black";
};

const getBorderColorForCategory = (category: string | null): string => {
  return category && borderColorsMap[category]
    ? borderColorsMap[category]
    : "border-gray-800";
};

// Cores vibrantes e alegres para o card de destaque baseadas na categoria
const featuredGradientMap: Record<string, string> = {
  Treino: "from-blue-500 via-indigo-600 to-purple-700",
  Nutrição: "from-emerald-500 via-teal-600 to-cyan-700",
  Motivação: "from-orange-400 via-amber-500 to-yellow-500",
  Recuperação: "from-violet-500 via-purple-600 to-fuchsia-700",
  Mindset: "from-rose-500 via-pink-600 to-red-600",
};

const getFeaturedGradient = (category: string | null): string => {
  return category && featuredGradientMap[category]
    ? featuredGradientMap[category]
    : "from-blue-500 via-indigo-600 to-purple-700";
};

const formatDate = (dateString: string | null): string => {
  if (!dateString)
    return new Date().toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const categories = [
  "Todos",
  "Treino",
  "Nutrição",
  "Motivação",
  "Recuperação",
  "Mindset",
];

const easing = [0.16, 1, 0.3, 1] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easing },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easing },
  },
};

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const isLoadingRef = useRef(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchPosts = async () => {
      // Evitar múltiplas chamadas simultâneas
      if (isLoadingRef.current) return;

      isLoadingRef.current = true;
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select(
            "id, slug, title, excerpt, author, category, read_time, published_at, created_at"
          )
          .not("published_at", "is", null)
          .lte("published_at", new Date().toISOString())
          .order("published_at", { ascending: false })
          .limit(50);

        if (abortController.signal.aborted || !isMounted) return;

        if (error) {
          console.error("Erro ao buscar posts do Supabase:", error);
          // Não usar fallback em caso de erro - apenas mostrar array vazio
          if (isMounted && !abortController.signal.aborted) {
            setBlogPosts([]);
          }
          return;
        }

        if (data && data.length > 0) {
          const posts: BlogPost[] = data.map((post) => {
            // Normalizar categoria ao buscar do banco (trim e capitalizar primeira letra)
            const rawCategory = (post.category || "").trim();
            const normalizedCategory = rawCategory
              ? rawCategory.charAt(0).toUpperCase() +
                rawCategory.slice(1).toLowerCase()
              : "Conteúdo";

            return {
              id: String(post.id),
              title: post.title,
              slug: post.slug,
              excerpt:
                post.excerpt ||
                "Conteúdo exclusivo elaborado pelo time Mova+ para impulsionar sua evolução.",
              author: post.author || "Equipe Mova+",
              date: formatDate(post.published_at),
              dateISO: post.published_at || new Date().toISOString(),
              createdISO: post.created_at || new Date().toISOString(), // Para ordenação secundária
              category: normalizedCategory,
              readTime: post.read_time || "5 min",
              featured: false, // Não usado mais, sempre será o primeiro filtrado
              accentGradient: getGradientForCategory(post.category),
            };
          });

          if (isMounted && !abortController.signal.aborted) {
            // Usar função de atualização para evitar perda de estado
            setBlogPosts((prevPosts) => {
              // Se for o mesmo conteúdo, não atualizar
              const prevIds = prevPosts
                .map((p) => p.id)
                .sort()
                .join(",");
              const newIds = posts
                .map((p) => p.id)
                .sort()
                .join(",");
              if (prevIds === newIds && prevPosts.length > 0) {
                return prevPosts;
              }
              return posts;
            });
          }
        } else {
          // Se não houver dados, mostrar array vazio (sem fallback)
          if (isMounted && !abortController.signal.aborted) {
            setBlogPosts([]);
          }
        }
      } catch (error) {
        if (isMounted && !abortController.signal.aborted) {
          console.error("Erro inesperado ao buscar posts:", error);
          // Não usar fallback em caso de erro - apenas mostrar array vazio
          setBlogPosts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          isLoadingRef.current = false;
        }
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
      abortController.abort();
      isLoadingRef.current = false;
    };
  }, []);

  const filteredPosts = useMemo(() => {
    // Verificação de segurança
    if (!blogPosts || !Array.isArray(blogPosts) || blogPosts.length === 0) {
      return [];
    }

    // Normalizar valores de entrada
    const normalizedSearchTerm = (searchTerm || "").trim().toLowerCase();
    const normalizedCategory = (selectedCategory || "Todos").trim();
    const showAll = normalizedCategory === "Todos";

    const filtered = blogPosts.filter((post) => {
      // Verificação de segurança para cada post
      if (!post || !post.id) return false;

      // Verificar categoria
      const postCategory = (post.category || "").trim().toLowerCase();
      const selectedCat = normalizedCategory.toLowerCase();
      const matchesCategory = showAll || postCategory === selectedCat;

      // Verificar busca - expandido para incluir título, excerpt, categoria e autor
      if (normalizedSearchTerm) {
        const postTitle = (post.title || "").toLowerCase();
        const postExcerpt = (post.excerpt || "").toLowerCase();
        const postCategorySearch = postCategory;
        const postAuthor = (post.author || "").toLowerCase();

        const matchesSearch =
          postTitle.includes(normalizedSearchTerm) ||
          postExcerpt.includes(normalizedSearchTerm) ||
          postCategorySearch.includes(normalizedSearchTerm) ||
          postAuthor.includes(normalizedSearchTerm);

        return matchesCategory && matchesSearch;
      }

      // Se não houver termo de busca, apenas filtrar por categoria
      return matchesCategory;
    });

    // Criar uma cópia antes de ordenar para evitar mutação
    // Ordenar por published_at (mais recente primeiro), depois por created_at se igual
    const sorted = [...filtered].sort((a, b) => {
      try {
        const dateA = a.dateISO ? new Date(a.dateISO).getTime() : 0;
        const dateB = b.dateISO ? new Date(b.dateISO).getTime() : 0;

        // Se as datas de publicação forem iguais, usar created_at como desempate
        if (dateB === dateA && dateA !== 0) {
          const createdA = a.createdISO ? new Date(a.createdISO).getTime() : 0;
          const createdB = b.createdISO ? new Date(b.createdISO).getTime() : 0;

          if (createdB !== createdA) {
            return createdB - createdA; // Mais recente primeiro
          }

          // Se ainda forem iguais, usar ID como último recurso
          return a.id.localeCompare(b.id) * -1;
        }

        return dateB - dateA; // Mais recente primeiro
      } catch {
        return 0;
      }
    });

    return sorted;
  }, [selectedCategory, searchTerm, blogPosts]);

  // Featured post sempre é o post mais recente (independente de filtros)
  const featuredPost = useMemo(() => {
    if (!blogPosts || blogPosts.length === 0) return null;

    // Ordenar todos os posts por data de publicação (mais recente primeiro) e pegar o primeiro
    // Se as datas de publicação forem iguais, usar created_at como critério secundário
    const sortedByDate = [...blogPosts].sort((a, b) => {
      try {
        // Usar dateISO que contém a data de publicação
        const dateA = a.dateISO ? new Date(a.dateISO).getTime() : 0;
        const dateB = b.dateISO ? new Date(b.dateISO).getTime() : 0;

        // Se as datas de publicação forem iguais, usar created_at como desempate
        if (dateB === dateA && dateA !== 0) {
          // Usar created_at para determinar qual foi criado mais recentemente
          const createdA = a.createdISO ? new Date(a.createdISO).getTime() : 0;
          const createdB = b.createdISO ? new Date(b.createdISO).getTime() : 0;

          if (createdB !== createdA) {
            return createdB - createdA; // Mais recente primeiro
          }

          // Se ainda forem iguais, usar ID como último recurso
          return a.id.localeCompare(b.id) * -1;
        }

        return dateB - dateA; // Mais recente primeiro (data maior = mais recente)
      } catch (error) {
        console.error("Erro ao ordenar posts por data:", error);
        return 0;
      }
    });

    return sortedByDate[0] || null;
  }, [blogPosts]);

  // Regular posts são os posts filtrados, excluindo o featured post se ele estiver nos filtrados
  const regularPosts = useMemo(() => {
    // Sempre retornar os posts filtrados, removendo o featured se ele estiver lá
    if (!featuredPost) return filteredPosts;

    // Remover o featured post dos posts filtrados
    return filteredPosts.filter((post) => post.id !== featuredPost.id);
  }, [filteredPosts, featuredPost]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-b from-white via-white to-gray-100">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gradient-to-r from-gray-200 via-white to-gray-200 blur-3xl" />
            <div className="absolute bottom-[-8rem] right-[-6rem] h-64 w-64 rounded-full bg-gradient-to-br from-gray-200 via-white to-gray-50 blur-3xl" />
          </div>

          <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center">
            <motion.span
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="mb-6 inline-flex items-center rounded-full border border-black/10 px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-gray-600"
            >
              Conteúdo exclusivo
            </motion.span>

            <motion.h1
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="text-4xl font-zalando-medium text-black sm:text-5xl md:text-6xl"
            >
              Insights para impulsionar a sua evolução
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mt-6 max-w-3xl text-base text-gray-600 sm:text-lg md:text-xl"
            >
              Estratégias de treino, nutrição e mindset construídas pelo time
              Mova+ para você aplicar imediatamente no seu plano personalizado.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mt-12 w-full max-w-2xl"
            >
              <label htmlFor="blog-search" className="sr-only">
                Buscar artigos do blog
              </label>
              <div className="relative flex items-center overflow-hidden rounded-full border border-black/10 bg-white shadow-[0_20px_80px_-40px_rgba(0,0,0,0.45)]">
                <Search className="ml-5 h-4 w-4 text-gray-400" />
                <input
                  id="blog-search"
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Busque por título, assunto, categoria ou autor"
                  className="w-full border-0 bg-transparent px-4 py-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-0 sm:text-base"
                />
                <span className="mr-4 hidden rounded-full border border-black px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-black sm:inline-flex">
                  Blog Mova+
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Categorias */}
        <section className="border-b border-gray-200 bg-white py-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="mx-auto flex max-w-5xl flex-wrap justify-center gap-2 px-4 sm:gap-3"
          >
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <motion.button
                  key={category}
                  variants={cardVariant}
                  layout
                  onClick={() => setSelectedCategory(category)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.16, 1, 0.3, 1],
                    layout: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                  }}
                  className={cn(
                    "group inline-flex items-center rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] sm:px-6 sm:py-2.5 sm:text-sm",
                    isActive
                      ? "border-black bg-black text-white shadow-[0_15px_40px_-25px_rgba(0,0,0,0.6)]"
                      : "border-gray-200 bg-white text-gray-600 hover:border-black hover:text-black"
                  )}
                >
                  {category}
                </motion.button>
              );
            })}
          </motion.div>
        </section>

        {/* Loading State */}
        {loading && (
          <section className="bg-white py-20">
            <div className="mx-auto max-w-6xl px-4">
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando posts...</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Destaque */}
        {!loading && featuredPost && (
          <section className="bg-white py-20">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
              className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[1.15fr_0.85fr]"
            >
              <div className="relative h-full rounded-[32px] overflow-hidden shadow-2xl">
                {/* Gradiente colorido de fundo baseado na categoria */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${getFeaturedGradient(
                    featuredPost.category
                  )}`}
                />
                {/* Overlay para dar profundidade */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.15),_transparent_50%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,_transparent_0%,_rgba(0,0,0,0.1)_100%)]" />

                <div className="relative z-10 flex h-full flex-col justify-between gap-8 p-8 md:p-12 text-white">
                  <div className="space-y-5">
                    <span className="inline-flex items-center rounded-full border-2 border-white/60 bg-white/20 backdrop-blur-md px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-lg">
                      Destaque Mova+
                    </span>
                    <h2 className="text-3xl font-zalando-medium sm:text-4xl md:text-5xl leading-tight drop-shadow-lg">
                      {featuredPost.title}
                    </h2>
                    <p className="max-w-2xl text-base text-white sm:text-lg leading-relaxed drop-shadow-md">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-xs uppercase tracking-[0.25em] text-white/95 sm:text-sm">
                    <span className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 backdrop-blur-sm">
                      <User className="h-4 w-4" />
                      {featuredPost.author}
                    </span>
                    <span className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 backdrop-blur-sm">
                      <Calendar className="h-4 w-4" />
                      {featuredPost.date}
                    </span>
                    <span className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 backdrop-blur-sm">
                      {featuredPost.readTime}
                    </span>
                  </div>

                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="group inline-flex items-center justify-center gap-3 rounded-full border-2 border-white bg-white/20 backdrop-blur-md px-8 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-white transition-all hover:bg-white hover:text-black hover:shadow-2xl hover:scale-105"
                  >
                    Ler artigo completo
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                  </Link>
                </div>
              </div>

              <div className="relative flex h-full items-end overflow-hidden rounded-[32px] border-2 border-gray-200 bg-gradient-to-br from-gray-50 via-white to-gray-100 shadow-lg">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,0,0,0.05),_transparent_60%)]" />
                <div className="relative z-10 flex flex-col gap-6 p-8 md:p-12">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                    <span className="h-1 w-8 bg-black rounded-full" />
                    Plano em ação
                  </span>
                  <h3 className="text-2xl md:text-3xl font-zalando-medium text-black leading-tight">
                    Transforme conhecimento em treino de alto impacto
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Combine IA, dados e os insights mais recentes do time Mova+
                    para evoluir com clareza e consistência.
                  </p>
                  <div className="grid gap-4 text-sm text-gray-700">
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-black flex-shrink-0" />
                      <span>Treinos estruturados para casa ou academia.</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-black flex-shrink-0" />
                      <span>Planos alimentares ajustados ao seu objetivo.</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-black flex-shrink-0" />
                      <span>Monitoramento inteligente da evolução.</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>
        )}

        {/* Lista de artigos */}
        {!loading && (
          <section className="bg-gray-50 py-24">
            <div className="mx-auto max-w-7xl px-4">
              {regularPosts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-600 text-lg">
                    {searchTerm || selectedCategory !== "Todos"
                      ? "Nenhum post encontrado com os filtros selecionados."
                      : "Nenhum post publicado ainda."}
                  </p>
                </div>
              ) : (
                <motion.div
                  key={selectedCategory} // Força re-render quando categoria muda
                  initial="hidden"
                  animate="visible"
                  viewport={{ once: false, amount: 0.15 }}
                  variants={staggerContainer}
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {regularPosts.map((post) => (
                    <motion.article
                      key={`${post.id}-${selectedCategory}`}
                      variants={cardVariant}
                      layout
                      className={cn(
                        "group relative flex h-full flex-col justify-between rounded-[28px] border-2 p-6 transition-all duration-300 hover:-translate-y-2 hover:text-white hover:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.65)] md:p-8",
                        getBorderColorForCategory(post.category),
                        "bg-white",
                        getHoverColorForCategory(post.category)
                      )}
                    >
                      <div>
                        <div
                          className={cn(
                            "h-16 w-full rounded-2xl bg-gradient-to-br",
                            post.accentGradient
                          )}
                        />
                        <div className="mt-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 group-hover:text-white/90">
                          <span>{post.category}</span>
                          <span className="h-1 w-1 rounded-full bg-black/40 group-hover:bg-white/80" />
                          <span>{post.readTime}</span>
                        </div>
                        <h3 className="mt-5 text-2xl font-zalando-medium text-black group-hover:text-white">
                          {post.title}
                        </h3>
                        <p className="mt-4 text-sm text-gray-600 transition-colors group-hover:text-gray-100">
                          {post.excerpt}
                        </p>
                      </div>

                      <div className="mt-10 flex flex-col gap-4 text-xs uppercase tracking-[0.25em] text-gray-500 group-hover:text-white/80">
                        <span className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {post.date}
                        </span>
                        <Link
                          href={`/blog/${post.slug}`}
                          className="group/link mt-2 inline-flex items-center gap-3 text-sm font-semibold tracking-[0.25em] text-black transition-colors hover:text-gray-700 group-hover:text-white group-hover:underline"
                        >
                          Ler mais
                          <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1 group-hover:text-white" />
                        </Link>
                      </div>
                    </motion.article>
                  ))}
                </motion.div>
              )}
            </div>
          </section>
        )}

        {/* Newsletter */}
        <section className="bg-black py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            className="mx-auto max-w-4xl px-4 text-center text-white"
          >
            <h2 className="text-3xl font-zalando-medium sm:text-4xl md:text-5xl">
              Receba os próximos insights primeiro
            </h2>
            <p className="mt-6 text-base text-white/70 sm:text-lg">
              Assine a newsletter do Mova+ e receba artigos, lançamentos e
              planos especiais diretamente no seu email.
            </p>
            <form
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!newsletterEmail || newsletterStatus === "loading") return;

                setNewsletterStatus("loading");
                try {
                  const response = await fetch("/api/subscribe-newsletter", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email: newsletterEmail }),
                  });

                  const data = await response.json();

                  if (!response.ok) {
                    throw new Error(data.error || "Erro ao inscrever-se");
                  }

                  setNewsletterStatus("success");
                  setNewsletterEmail("");
                  setTimeout(() => setNewsletterStatus("idle"), 3000);
                } catch (error) {
                  console.error("Erro ao inscrever-se:", error);
                  setNewsletterStatus("error");
                  setTimeout(() => setNewsletterStatus("idle"), 3000);
                }
              }}
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Endereço de email
              </label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Digite seu melhor email"
                required
                disabled={newsletterStatus === "loading"}
                className="w-full max-w-md rounded-full border border-white/30 bg-transparent px-6 py-4 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/60 sm:text-base disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={
                  newsletterStatus === "loading" ||
                  newsletterStatus === "success"
                }
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {newsletterStatus === "loading"
                  ? "Enviando..."
                  : newsletterStatus === "success"
                    ? "Inscrito!"
                    : "Quero receber"}
              </button>
            </form>
            {newsletterStatus === "error" && (
              <p className="mt-4 text-sm text-red-300">
                Erro ao inscrever-se. Tente novamente.
              </p>
            )}
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
