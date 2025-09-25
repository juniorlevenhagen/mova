"use client";

import { useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Calendar, User, ArrowRight, Search } from "lucide-react";

const blogPosts = [
  {
    id: 1,
    title: "Como Começar uma Rotina de Exercícios em Casa",
    excerpt:
      "Dicas práticas para criar uma rotina de exercícios eficaz no conforto da sua casa, sem equipamentos caros.",
    author: "Dr. Ana Silva",
    date: "15 Jan 2024",
    category: "Treino",
    readTime: "5 min",
    image: "🏠",
    featured: true,
  },
  {
    id: 2,
    title: "Os 10 Alimentos Essenciais para Ganho de Massa Muscular",
    excerpt:
      "Descubra quais alimentos não podem faltar na sua dieta para maximizar seus ganhos musculares.",
    author: "Marina Costa",
    date: "12 Jan 2024",
    category: "Nutrição",
    readTime: "7 min",
    image: "🥗",
    featured: false,
  },
  {
    id: 3,
    title: "Entendendo o HIIT: Treino Intervalado de Alta Intensidade",
    excerpt:
      "Tudo sobre HIIT: benefícios, como fazer e por que é tão eficaz para queimar gordura.",
    author: "Carlos Mendes",
    date: "10 Jan 2024",
    category: "Treino",
    readTime: "6 min",
    image: "⚡",
    featured: false,
  },
  {
    id: 4,
    title: "Como Manter a Motivação nos Dias Difíceis",
    excerpt:
      "Estratégias comprovadas para manter o foco e a disciplina mesmo quando a motivação está baixa.",
    author: "Dr. Ana Silva",
    date: "8 Jan 2024",
    category: "Motivação",
    readTime: "4 min",
    image: "💪",
    featured: false,
  },
  {
    id: 5,
    title: "Hidratação: A Base de Toda Performance",
    excerpt:
      "Por que a hidratação é fundamental e como calcular suas necessidades diárias de água.",
    author: "Marina Costa",
    date: "5 Jan 2024",
    category: "Nutrição",
    readTime: "5 min",
    image: "💧",
    featured: false,
  },
  {
    id: 6,
    title: "Recuperação Muscular: O Que Você Precisa Saber",
    excerpt:
      "A importância do descanso e técnicas para acelerar a recuperação entre os treinos.",
    author: "Carlos Mendes",
    date: "3 Jan 2024",
    category: "Recuperação",
    readTime: "8 min",
    image: "��",
    featured: false,
  },
];

const categories = ["Todos", "Treino", "Nutrição", "Motivação", "Recuperação"];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory =
      selectedCategory === "Todos" || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = blogPosts.find((post) => post.featured);
  const regularPosts = filteredPosts.filter((post) => !post.featured);

  return (
    <div className="min-h-screen bg-[#f5f1e8]">
      <Navbar />

      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-[#f5f1e8] to-white py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            Blog <span className="text-gray-600">Mova+</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Dicas, estratégias e insights para transformar sua vida através do
            movimento
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar artigos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="w-full bg-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="w-full bg-white py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-3xl p-8 md:p-12 text-white">
              <div className="flex items-center mb-4">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                  Destaque
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {featuredPost.title}
              </h2>
              <p className="text-xl opacity-90 mb-6">{featuredPost.excerpt}</p>
              <div className="flex items-center space-x-6 text-sm opacity-80">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  {featuredPost.author}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {featuredPost.date}
                </div>
                <div>{featuredPost.readTime}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="w-full bg-[#f5f1e8] py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
              >
                <div className="p-8">
                  <div className="text-4xl mb-4">{post.image}</div>
                  <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <User className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{post.date}</span>
                    </div>
                  </div>
                </div>
                <div className="px-8 pb-8">
                  <button className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200">
                    Ler mais
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="w-full bg-gray-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Fique por dentro das novidades
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Receba nossos melhores artigos e dicas exclusivas diretamente no seu
            email
          </p>
          <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
            <input
              type="email"
              placeholder="Seu melhor email"
              className="flex-1 px-6 py-4 rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-8 py-4 rounded-lg font-medium hover:from-blue-600 hover:to-green-600 transition-all duration-300">
              Inscrever-se
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
