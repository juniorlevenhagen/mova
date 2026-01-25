"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { SuccessModal } from "@/components/admin/SuccessModal";
import { ArrowLeft, Save } from "lucide-react";

const CATEGORIES = [
  "Treino",
  "Nutrição",
  "Motivação",
  "Recuperação",
  "Mindset",
];

type PostData = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  author: string | null;
  category: string | null;
  read_time: string | null;
  published_at: string | null;
  key_takeaways: string[];
  sections: Array<{ heading?: string; body?: string }>;
  highlighted_quote: { text?: string; author?: string } | null;
};

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PostData | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar post:", error);
        alert("Erro ao carregar post.");
        router.push("/admin/blog");
        return;
      }

      if (!data) {
        alert("Post não encontrado.");
        router.push("/admin/blog");
        return;
      }

      // Normalizar dados
      const normalized: PostData = {
        id: data.id,
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt || "",
        content: data.content || "",
        author: data.author || "",
        category: data.category || "Treino",
        read_time: data.read_time || "5 min",
        published_at: data.published_at
          ? new Date(data.published_at).toISOString().split("T")[0]
          : "",
        key_takeaways: Array.isArray(data.key_takeaways)
          ? data.key_takeaways.filter((item: string) => item)
          : [],
        sections: Array.isArray(data.sections)
          ? data.sections.filter(
              (s: { heading?: string; body?: string } | null) =>
                s && (s.heading || s.body)
            )
          : [{ heading: "", body: "" }],
        highlighted_quote: data.highlighted_quote || { text: "", author: "" },
      };

      // Garantir pelo menos um item vazio em arrays
      if (normalized.key_takeaways.length === 0) {
        normalized.key_takeaways = [""];
      }
      if (normalized.sections.length === 0) {
        normalized.sections = [{ heading: "", body: "" }];
      }

      setFormData(normalized);
    } catch (error) {
      console.error("Erro inesperado:", error);
      alert("Erro ao carregar post.");
      router.push("/admin/blog");
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  useEffect(() => {
    if (!user) return;
    fetchPost();
  }, [user, fetchPost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setSaving(true);

    try {
      const updateData = {
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
          (s) => s.heading?.trim() || s.body?.trim()
        ),
        highlighted_quote:
          formData.highlighted_quote?.text?.trim() ||
          formData.highlighted_quote?.author?.trim()
            ? formData.highlighted_quote
            : null,
      };

      const { error } = await supabase
        .from("blog_posts")
        .update(updateData)
        .eq("id", formData.id);

      if (error) {
        console.error("Erro ao atualizar post:", error);
        alert(`Erro ao salvar post: ${error.message}`);
        setSaving(false);
        return;
      }

      // Mostrar modal de sucesso
      setShowSuccessModal(true);
      setSaving(false);
    } catch (error) {
      console.error("Erro inesperado:", error);
      alert("Erro inesperado ao salvar post.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminProtectedRoute>
        <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando post...</p>
          </div>
        </div>
      </AdminProtectedRoute>
    );
  }

  if (!formData) {
    return null;
  }

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
              Editar Post
            </h1>
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
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-black mb-2">
                    Slug (URL)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    O slug não pode ser alterado após a criação
                  </p>
                </div>
              </div>

              {/* Resumo */}
              <div>
                <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-black mb-2">
                  Resumo
                </label>
                <textarea
                  value={formData.excerpt || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, excerpt: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Conteúdo */}
              <div>
                <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-black mb-2">
                  Conteúdo Principal
                </label>
                <textarea
                  value={formData.content || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={10}
                  className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-mono text-sm"
                />
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">
                    Separe parágrafos com uma linha em branco
                  </p>
                  <p className="text-xs text-gray-500">
                    <strong>Formatação:</strong> Use{" "}
                    <code className="bg-gray-100 px-1 rounded">**texto**</code>{" "}
                    para <strong>negrito</strong> e{" "}
                    <code className="bg-gray-100 px-1 rounded">*texto*</code>{" "}
                    para <em>itálico</em>
                  </p>
                  <p className="text-xs text-gray-500">
                    <strong>Imagens:</strong> Use{" "}
                    <code className="bg-gray-100 px-1 rounded">
                      ![descrição](url-da-imagem)
                    </code>{" "}
                    para adicionar imagens. As imagens serão redimensionadas
                    automaticamente para carregamento rápido.
                  </p>
                </div>
              </div>

              {/* Metadados */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-black mb-2">
                    Autor
                  </label>
                  <input
                    type="text"
                    value={formData.author || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, author: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-[0.2em] text-black mb-2">
                    Categoria
                  </label>
                  <select
                    value={formData.category || "Treino"}
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
                    value={formData.read_time || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, read_time: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
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
                  value={formData.published_at || ""}
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
                        setFormData({
                          ...formData,
                          key_takeaways: newTakeaways,
                        });
                      }}
                      className="flex-1 px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
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
                  <div
                    key={index}
                    className="mb-4 p-4 border-2 border-gray-200 rounded-lg"
                  >
                    <input
                      type="text"
                      value={section.heading || ""}
                      onChange={(e) => {
                        const newSections = [...formData.sections];
                        newSections[index] = {
                          ...newSections[index],
                          heading: e.target.value,
                        };
                        setFormData({ ...formData, sections: newSections });
                      }}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Título da seção"
                    />
                    <textarea
                      value={section.body || ""}
                      onChange={(e) => {
                        const newSections = [...formData.sections];
                        newSections[index] = {
                          ...newSections[index],
                          body: e.target.value,
                        };
                        setFormData({ ...formData, sections: newSections });
                      }}
                      rows={3}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Conteúdo da seção"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Use{" "}
                      <code className="bg-gray-100 px-1 rounded">
                        **texto**
                      </code>{" "}
                      para <strong>negrito</strong> e{" "}
                      <code className="bg-gray-100 px-1 rounded">*texto*</code>{" "}
                      para <em>itálico</em>
                    </p>
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
                      sections: [
                        ...formData.sections,
                        { heading: "", body: "" },
                      ],
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
                  value={formData.highlighted_quote?.text || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      highlighted_quote: {
                        ...formData.highlighted_quote,
                        text: e.target.value,
                        author: formData.highlighted_quote?.author || "",
                      },
                    });
                  }}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-black rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Texto da citação"
                />
                <input
                  type="text"
                  value={formData.highlighted_quote?.author || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      highlighted_quote: {
                        ...formData.highlighted_quote,
                        text: formData.highlighted_quote?.text || "",
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
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-zalando font-semibold disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {saving ? "Salvando..." : "Salvar Alterações"}
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
        title="Post atualizado com sucesso!"
        message="Suas alterações foram salvas e estão disponíveis. O post foi atualizado na lista de posts."
        postSlug={formData?.slug || undefined}
        redirectTo="/admin/blog"
      />
    </AdminProtectedRoute>
  );
}
