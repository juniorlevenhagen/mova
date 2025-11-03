"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Calendar, User, ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { BackgroundGradient } from "@/components/ui/shadcn-io/background-gradient";

const blogPosts = [
  {
    id: 1,
    title: "Como Começar uma Rotina de Exercícios em Casa",
    excerpt:
      "Estruture seus treinos com métodos eficientes, sem equipamentos caros e com resultados consistentes.",
    author: "Dr. Ana Silva",
    date: "15 Jan 2024",
    category: "Treino",
    readTime: "5 min",
    featured: true,
    slug: "como-comecar-uma-rotina-de-exercicios-em-casa",
    accentGradient: "from-gray-900 via-gray-800 to-black",
  },
  {
    id: 2,
    title: "Os 10 Alimentos Essenciais para Ganho de Massa Muscular",
    excerpt:
      "Conheça os alimentos que garantem aporte nutricional completo para construir massa magra com saúde.",
    author: "Marina Costa",
    date: "12 Jan 2024",
    category: "Nutrição",
    readTime: "7 min",
    featured: false,
    slug: "alimentos-essenciais-para-ganho-de-massa-muscular",
    accentGradient: "from-emerald-200 via-emerald-100 to-white",
  },
  {
    id: 3,
    title: "Entendendo o HIIT: Treino Intervalado de Alta Intensidade",
    excerpt:
      "Desmistifique o HIIT e aprenda a aplicar sessões curtas e intensas para acelerar a queima de gordura.",
    author: "Carlos Mendes",
    date: "10 Jan 2024",
    category: "Treino",
    readTime: "6 min",
    featured: false,
    slug: "entendendo-o-hiit",
    accentGradient: "from-slate-200 via-white to-slate-50",
  },
  {
    id: 4,
    title: "Como Manter a Motivação nos Dias Difíceis",
    excerpt:
      "Ferramentas práticas para driblar a falta de motivação e seguir comprometido com o seu plano.",
    author: "Dr. Ana Silva",
    date: "8 Jan 2024",
    category: "Motivação",
    readTime: "4 min",
    featured: false,
    slug: "como-manter-a-motivacao-nos-dias-dificeis",
    accentGradient: "from-yellow-200 via-amber-100 to-white",
  },
  {
    id: 5,
    title: "Hidratação: A Base de Toda Performance",
    excerpt:
      "Entenda o impacto da hidratação na performance e saiba como adequar o consumo ao seu objetivo.",
    author: "Marina Costa",
    date: "5 Jan 2024",
    category: "Nutrição",
    readTime: "5 min",
    featured: false,
    slug: "hidratacao-base-da-performance",
    accentGradient: "from-sky-200 via-sky-100 to-white",
  },
  {
    id: 6,
    title: "Recuperação Muscular: O Que Você Precisa Saber",
    excerpt:
      "Otimize descanso, sono e técnicas complementares para evoluir com segurança entre os treinos.",
    author: "Carlos Mendes",
    date: "3 Jan 2024",
    category: "Recuperação",
    readTime: "8 min",
    featured: false,
    slug: "recuperacao-muscular-o-que-voce-precisa-saber",
    accentGradient: "from-purple-200 via-purple-100 to-white",
  },
  {
    id: 7,
    title: "Mindset Atlético: Como Construir Disciplina Diária",
    excerpt:
      "Aprenda rituais simples para manter consistência, organizar sua rotina e sustentar resultados duradouros.",
    author: "Fernanda Lopes",
    date: "1 Jan 2024",
    category: "Mindset",
    readTime: "6 min",
    featured: false,
    slug: "mindset-atletico-disciplina-diaria",
    accentGradient: "from-rose-200 via-rose-100 to-white",
  },
];

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

  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const matchesCategory =
        selectedCategory === "Todos" || post.category === selectedCategory;
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  const featuredPost = filteredPosts.find((post) => post.featured);
  const regularPosts = filteredPosts.filter(
    (post) => post.id !== featuredPost?.id
  );

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
                  placeholder="Busque por título ou assunto"
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
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "group inline-flex items-center rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-200 sm:px-6 sm:py-2.5 sm:text-sm",
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

        {/* Destaque */}
        {featuredPost && (
          <section className="bg-white py-20">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
              className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[1.15fr_0.85fr]"
            >
              <BackgroundGradient className="relative h-full rounded-[32px] border border-gray-200 bg-white p-8 md:p-12">
                <div className="absolute inset-0 -z-10 overflow-hidden rounded-[32px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-gray-700 opacity-70" />
                </div>

                <div className="relative z-10 flex h-full flex-col justify-between gap-10 text-white">
                  <div className="space-y-5">
                    <span className="inline-flex items-center rounded-full border border-white/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em]">
                      Destaque Mova+
                    </span>
                    <h2 className="text-3xl font-zalando-medium sm:text-4xl md:text-5xl">
                      {featuredPost.title}
                    </h2>
                    <p className="max-w-2xl text-base text-white/85 sm:text-lg">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-xs uppercase tracking-[0.25em] text-white/80 sm:text-sm">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {featuredPost.author}
                    </span>
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {featuredPost.date}
                    </span>
                    <span>{featuredPost.readTime}</span>
                  </div>

                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="group inline-flex items-center gap-3 rounded-full border border-white/60 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] transition hover:border-white hover:bg-white hover:text-black"
                  >
                    Ler artigo completo
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </Link>
                </div>
              </BackgroundGradient>

              <div className="relative flex h-full items-end overflow-hidden rounded-[32px] border border-gray-200 bg-gray-50">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.08),_transparent_55%)]" />
                <div className="relative z-10 flex flex-col gap-6 p-8 md:p-12">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                    Plano em ação
                  </span>
                  <h3 className="text-2xl font-zalando-medium text-black">
                    Transforme conhecimento em treino de alto impacto
                  </h3>
                  <p className="text-sm text-gray-600">
                    Combine IA, dados e os insights mais recentes do time Mova+
                    para evoluir com clareza e consistência.
                  </p>
                  <div className="grid gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-black" />
                      Treinos estruturados para casa ou academia.
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-black" />
                      Planos alimentares ajustados ao seu objetivo.
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-black" />
                      Monitoramento inteligente da evolução.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>
        )}

        {/* Lista de artigos */}
        <section className="bg-gray-50 py-24">
          <div className="mx-auto max-w-7xl px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={staggerContainer}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {regularPosts.map((post) => (
                <motion.article
                  key={post.id}
                  variants={cardVariant}
                  className="group relative flex h-full flex-col justify-between rounded-[28px] border-2 border-black bg-white p-6 transition-all duration-300 hover:-translate-y-2 hover:bg-black hover:text-white hover:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.65)] md:p-8"
                >
                  <div>
                    <div
                      className={cn(
                        "h-16 w-full rounded-2xl bg-gradient-to-br",
                        post.accentGradient
                      )}
                    />
                    <div className="mt-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 group-hover:text-white/70">
                      <span>{post.category}</span>
                      <span className="h-1 w-1 rounded-full bg-black/40 group-hover:bg-white/60" />
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="mt-5 text-2xl font-zalando-medium text-black group-hover:text-white">
                      {post.title}
                    </h3>
                    <p className="mt-4 text-sm text-gray-600 transition-colors group-hover:text-gray-200">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="mt-10 flex flex-col gap-4 text-xs uppercase tracking-[0.25em] text-gray-500 group-hover:text-white/70">
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
                      className="group/button mt-2 inline-flex items-center gap-3 text-sm font-semibold tracking-[0.25em] text-black transition group-hover/button:text-white"
                    >
                      Ler mais
                      <ArrowRight className="h-4 w-4 transition group-hover/button:translate-x-1" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

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
              onSubmit={(event) => event.preventDefault()}
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Endereço de email
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Digite seu melhor email"
                required
                className="w-full max-w-md rounded-full border border-white/30 bg-transparent px-6 py-4 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/60 sm:text-base"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-xs font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-gray-100"
              >
                Quero receber
              </button>
            </form>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
