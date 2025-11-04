"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { SuccessModal } from "@/components/admin/SuccessModal";
import { ArrowLeft, Save, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

const CATEGORIES = ["Treino", "Nutrição", "Motivação", "Recuperação", "Mindset"];

export default function NewBlogPostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPostSlug, setCreatedPostSlug] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    excerpt: "",
    content: "",
    author: user?.user_metadata?.full_name || "",
    category: "Treino",
    read_time: "5 min",
    published_at: new Date().toISOString().split("T")[0],
    key_takeaways: [""],
    sections: [{ heading: "", body: "" }],
    highlighted_quote: { text: "", author: "" },
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title, slug: generateSlug(title) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar campos obrigatórios
      if (!formData.slug || !formData.title) {
        alert("Título e slug são obrigatórios!");
        setLoading(false);
        return;
      }

      // Preparar dados para inserção
      const postData = {
        slug: formData.slug,
        title: formData.title,
        excerpt: formData.excerpt || null,
        content: formData.content || null,
        author: formData.author || null,
        category: formData.category || null,
        read_time: formData.read_time || null,
        published_at: formData.published_at
          ? new Date(formData.published_at).toISOString()
          : null,
        key_takeaways: formData.key_takeaways.filter((item) => item.trim()),
        sections: formData.sections.filter(
          (s) => s.heading.trim() || s.body.trim()
        ),
        highlighted_quote:
          formData.highlighted_quote.text.trim() ||
          formData.highlighted_quote.author.trim()
            ? formData.highlighted_quote
            : null,
      };

      const { error } = await supabase
        .from("blog_posts")
        .insert([postData]);

      if (error) {
        console.error("Erro ao criar post:", error);
        alert(`Erro ao criar post: ${error.message}`);
        setLoading(false);
        return;
      }

      // Mostrar modal de sucesso
      setCreatedPostSlug(formData.slug);
      setShowSuccessModal(true);
      setLoading(false);
    } catch (error) {
      console.error("Erro inesperado:", error);
      alert("Erro inesperado ao criar post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/blog"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para lista
            </Link>
            <h1 className="text-3xl md:text-4xl font-zalando-medium text-black">
              Criar Novo Post
            </h1>
          </div>

          {/* Guia Passo a Passo */}
          <div className="mb-8 bg-white rounded-[24px] border-2 border-black overflow-hidden">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-lg font-zalando-medium text-black">
                Guia Passo a Passo para Criar um Post
              </h2>
              {showGuide ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {showGuide && (
              <div className="px-6 py-4 border-t-2 border-black">
                <div className="space-y-6">
                  {/* Passo 1 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-zalando-medium text-sm">
                        1
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-zalando-medium text-black mb-2">
                        Título e Slug
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Preencha o título do post. O slug será gerado automaticamente, mas você pode editá-lo manualmente.
                      </p>
                      <ul className="text-xs text-gray-500 space-y-1 ml-4 list-disc">
                        <li>O título deve ser claro e descritivo</li>
                        <li>O slug será usado na URL do post</li>
                        <li>Apenas letras minúsculas, números e hífens no slug</li>
                      </ul>
                    </div>
                  </div>

                  {/* Passo 2 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-zalando-medium text-sm">
                        2
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-zalando-medium text-black mb-2">
                        Resumo e Conteúdo Principal
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Escreva um resumo curto que aparecerá na listagem do blog e o conteúdo completo do artigo.
                      </p>
                      <ul className="text-xs text-gray-500 space-y-1 ml-4 list-disc">
                        <li>O resumo deve ter entre 100-200 caracteres</li>
                        <li>Separe parágrafos do conteúdo com uma linha em branco</li>
                        <li>Use formatação simples e clara</li>
                      </ul>
                    </div>
                  </div>

                  {/* Passo 3 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-zalando-medium text-sm">
                        3
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-zalando-medium text-black mb-2">
                        Metadados
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Preencha autor, categoria e tempo de leitura estimado.
                      </p>
                      <ul className="text-xs text-gray-500 space-y-1 ml-4 list-disc">
                        <li>Escolha a categoria mais adequada ao conteúdo</li>
                        <li>O tempo de leitura ajuda os leitores a planejarem</li>
                        <li>Use o nome completo do autor</li>
                      </ul>
                    </div>
                  </div>

                  {/* Passo 4 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-zalando-medium text-sm">
                        4
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-zalando-medium text-black mb-2">
                        Principais Insights (Key Takeaways)
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Liste os principais pontos que o leitor deve levar do artigo. Esses aparecerão destacados no post.
                      </p>
                      <ul className="text-xs text-gray-500 space-y-1 ml-4 list-disc">
                        <li>Use 3-5 insights principais</li>
                        <li>Cada insight deve ser uma frase curta e clara</li>
                        <li>Foque nos pontos mais importantes do artigo</li>
                      </ul>
                    </div>
                  </div>

                  {/* Passo 5 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-zalando-medium text-sm">
                        5
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-zalando-medium text-black mb-2">
                        Seções do Artigo (Opcional)
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Se o artigo tiver seções com títulos específicos, adicione-as aqui. Isso ajuda na organização e navegação.
                      </p>
                      <ul className="text-xs text-gray-500 space-y-1 ml-4 list-disc">
                        <li>Cada seção precisa de um título e conteúdo</li>
                        <li>Use seções para dividir tópicos complexos</li>
                        <li>As seções aparecerão formatadas no post final</li>
                      </ul>
                    </div>
                  </div>

                  {/* Passo 6 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-zalando-medium text-sm">
                        6
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-zalando-medium text-black mb-2">
                        Citação Destacada (Opcional)
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Se houver uma citação importante no artigo, adicione-a aqui. Ela será destacada visualmente no post.
                      </p>
                      <ul className="text-xs text-gray-500 space-y-1 ml-4 list-disc">
                        <li>Use citações relevantes e impactantes</li>
                        <li>Inclua o autor da citação quando disponível</li>
                        <li>Esta é opcional, pode deixar em branco</li>
                      </ul>
                    </div>
                  </div>

                  {/* Passo 7 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-zalando-medium text-sm">
                        7
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-zalando-medium text-black mb-2">
                        Data de Publicação e Finalização
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Escolha quando o post será publicado. Por padrão, é a data atual. Revise tudo antes de salvar.
                      </p>
                      <ul className="text-xs text-gray-500 space-y-1 ml-4 list-disc">
                        <li>O post só aparecerá publicamente após a data de publicação</li>
                        <li>Revise título, conteúdo e metadados antes de salvar</li>
                        <li>Clique em "Salvar Post" quando estiver pronto</li>
                      </ul>
                    </div>
                  </div>

                  {/* Dica Final */}
                  <div className="mt-6 pt-6 border-t-2 border-gray-200 bg-gray-50 rounded-lg p-4">
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-zalando-medium text-black mb-1">
                          Dica Final
                        </h3>
                        <p className="text-sm text-gray-600">
                          Você pode editar o post depois de criado. Após salvar, você será redirecionado para a lista de posts onde poderá visualizar, editar ou excluir o post criado.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-[24px] border-2 border-black p-8 space-y-6">
              {/* Título e Slug */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-black mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Título do post"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-black mb-2">
                    Slug (URL) *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-mono text-sm"
                    placeholder="titulo-do-post"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    URL do post: /blog/{formData.slug || "titulo-do-post"}
                  </p>
                </div>
              </div>

              {/* Resumo */}
              <div>
                <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-black mb-2">
                  Resumo
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData({ ...formData, excerpt: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Breve descrição do post"
                />
              </div>

              {/* Conteúdo */}
              <div>
                <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-black mb-2">
                  Conteúdo Principal
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={10}
                  className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-mono text-sm"
                  placeholder="Conteúdo do artigo. Cada parágrafo deve ser separado por uma linha em branco."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Separe parágrafos com uma linha em branco
                </p>
              </div>

              {/* Metadados */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-black mb-2">
                    Autor
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) =>
                      setFormData({ ...formData, author: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Nome do autor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-black mb-2">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-black mb-2">
                    Tempo de Leitura
                  </label>
                  <input
                    type="text"
                    value={formData.read_time}
                    onChange={(e) =>
                      setFormData({ ...formData, read_time: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="5 min"
                  />
                </div>
              </div>

              {/* Data de Publicação */}
              <div>
                <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-black mb-2">
                  Data de Publicação
                </label>
                <input
                  type="date"
                  value={formData.published_at}
                  onChange={(e) =>
                    setFormData({ ...formData, published_at: e.target.value })
                  }
                  className="px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Key Takeaways */}
              <div>
                <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-black mb-2">
                  Principais Insights
                </label>
                {formData.key_takeaways.map((item, index) => (
                  <div key={index} className="mb-2 flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newTakeaways = [...formData.key_takeaways];
                        newTakeaways[index] = e.target.value;
                        setFormData({ ...formData, key_takeaways: newTakeaways });
                      }}
                      className="flex-1 px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder={`Insight ${index + 1}`}
                    />
                    {formData.key_takeaways.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newTakeaways = formData.key_takeaways.filter(
                            (_, i) => i !== index
                          );
                          setFormData({
                            ...formData,
                            key_takeaways: newTakeaways,
                          });
                        }}
                        className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      key_takeaways: [...formData.key_takeaways, ""],
                    });
                  }}
                  className="mt-2 px-4 py-2 border-2 border-black rounded-lg hover:bg-black hover:text-white transition-colors text-sm font-semibold"
                >
                  + Adicionar Insight
                </button>
              </div>

              {/* Seções */}
              <div>
                <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-black mb-2">
                  Seções do Artigo
                </label>
                {formData.sections.map((section, index) => (
                  <div key={index} className="mb-4 p-4 border-2 border-gray-200 rounded-lg">
                    <input
                      type="text"
                      value={section.heading}
                      onChange={(e) => {
                        const newSections = [...formData.sections];
                        newSections[index].heading = e.target.value;
                        setFormData({ ...formData, sections: newSections });
                      }}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Título da seção"
                    />
                    <textarea
                      value={section.body}
                      onChange={(e) => {
                        const newSections = [...formData.sections];
                        newSections[index].body = e.target.value;
                        setFormData({ ...formData, sections: newSections });
                      }}
                      rows={3}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Conteúdo da seção"
                    />
                    {formData.sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newSections = formData.sections.filter(
                            (_, i) => i !== index
                          );
                          setFormData({ ...formData, sections: newSections });
                        }}
                        className="mt-2 px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-sm"
                      >
                        Remover Seção
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      sections: [...formData.sections, { heading: "", body: "" }],
                    });
                  }}
                  className="px-4 py-2 border-2 border-black rounded-lg hover:bg-black hover:text-white transition-colors text-sm font-semibold"
                >
                  + Adicionar Seção
                </button>
              </div>

              {/* Citação Destacada */}
              <div>
                <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-black mb-2">
                  Citação Destacada (Opcional)
                </label>
                <textarea
                  value={formData.highlighted_quote.text}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      highlighted_quote: {
                        ...formData.highlighted_quote,
                        text: e.target.value,
                      },
                    });
                  }}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-black rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Texto da citação"
                />
                <input
                  type="text"
                  value={formData.highlighted_quote.author}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      highlighted_quote: {
                        ...formData.highlighted_quote,
                        author: e.target.value,
                      },
                    });
                  }}
                  className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Autor da citação"
                />
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-4">
              <Link
                href="/admin/blog"
                className="px-6 py-3 border-2 border-black rounded-lg hover:bg-black hover:text-white transition-colors font-zalando font-semibold"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-zalando font-semibold disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {loading ? "Salvando..." : "Salvar Post"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Sucesso */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.push("/admin/blog");
        }}
        title="Post criado com sucesso!"
        message="Seu post foi salvo e está disponível na lista de posts. Você pode editá-lo a qualquer momento."
        postSlug={createdPostSlug || undefined}
        redirectTo="/admin/blog"
      />
    </AdminProtectedRoute>
  );
}

