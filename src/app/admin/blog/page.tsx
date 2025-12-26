"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal";
import { Plus, Edit, Eye, Trash2, Calendar } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  author: string | null;
  category: string | null;
  read_time: string | null;
  published_at: string | null;
  created_at: string;
};

export default function AdminBlogPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    postId: string | null;
    postTitle: string;
    postSlug: string;
  }>({
    isOpen: false,
    postId: null,
    postTitle: "",
    postSlug: "",
  });

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("blog_posts")
        .select(
          "id, slug, title, excerpt, author, category, read_time, published_at, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar posts:", error);
        return;
      }

      setPosts(data || []);
    } catch (error) {
      console.error("Erro inesperado:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user, fetchPosts]);

  const handleDeleteClick = (id: string, title: string, slug: string) => {
    setDeleteModal({
      isOpen: true,
      postId: id,
      postTitle: title,
      postSlug: slug,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.postId) return;

    setDeletingId(deleteModal.postId);
    try {
      console.log("🗑️ Tentando deletar post ID:", deleteModal.postId);

      // Verificar autenticação primeiro
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        console.error("❌ Usuário não autenticado");
        alert("Erro: Você precisa estar autenticado para excluir posts.");
        setDeleteModal({
          isOpen: false,
          postId: null,
          postTitle: "",
          postSlug: "",
        });
        setDeletingId(null);
        return;
      }

      console.log("✅ Usuário autenticado:", currentUser.email);

      const { data, error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", deleteModal.postId)
        .select(); // Retornar dados deletados para verificar

      console.log("📊 Resultado da deleção:", { data, error });

      if (error) {
        console.error("❌ Erro ao excluir:", error);
        console.error("Detalhes do erro:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        setDeleteModal({
          isOpen: false,
          postId: null,
          postTitle: "",
          postSlug: "",
        });
        setDeletingId(null);
        alert(
          `Erro ao excluir post: ${error.message}\n\nCódigo: ${error.code || "N/A"}\n\nVerifique se você tem permissão para excluir posts ou se há políticas RLS bloqueando a ação.`
        );
        return;
      }

      // Verificar se realmente deletou
      if (data && data.length > 0) {
        console.log("✅ Post deletado com sucesso:", data);
      } else {
        console.warn(
          "⚠️ Nenhum dado retornado na deleção. Pode ter sido deletado ou não existe."
        );
      }

      // Atualizar lista local
      setPosts((prevPosts) =>
        prevPosts.filter((post) => post.id !== deleteModal.postId)
      );
      setDeleteModal({
        isOpen: false,
        postId: null,
        postTitle: "",
        postSlug: "",
      });
      setDeletingId(null);

      // Recarregar lista do servidor para garantir sincronização
      await fetchPosts();
    } catch (error) {
      console.error("❌ Erro inesperado:", error);
      setDeleteModal({
        isOpen: false,
        postId: null,
        postTitle: "",
        postSlug: "",
      });
      setDeletingId(null);
      alert(
        `Erro inesperado ao excluir post: ${error instanceof Error ? error.message : "Erro desconhecido"}`
      );
    }
  };

  const handleDeleteCancel = () => {
    if (!deletingId) {
      setDeleteModal({
        isOpen: false,
        postId: null,
        postTitle: "",
        postSlug: "",
      });
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Não publicado";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Navigation */}
          <AdminNav />

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-zalando-medium text-black mb-2">
                Gerenciar Blog
              </h1>
              <p className="text-gray-600">
                Crie, edite e gerencie os posts do blog Mova+
              </p>
            </div>
            <Link
              href="/admin/blog/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-zalando font-semibold"
            >
              <Plus className="h-5 w-5" />
              Novo Post
            </Link>
          </div>

          {/* Lista de Posts */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando posts...</p>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[24px] border-2 border-black">
              <p className="text-gray-600 mb-6">Nenhum post criado ainda.</p>
              <Link
                href="/admin/blog/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-zalando font-semibold"
              >
                <Plus className="h-5 w-5" />
                Criar primeiro post
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-[24px] border-2 border-black overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-[0.2em]">
                        Título
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-[0.2em]">
                        Categoria
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-[0.2em]">
                        Autor
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-[0.2em]">
                        Publicado
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-[0.2em]">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {posts.map((post) => (
                      <tr
                        key={post.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-black">
                            {post.title}
                          </div>
                          {post.excerpt && (
                            <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                              {post.excerpt}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full border border-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                            {post.category || "Sem categoria"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {post.author || "Sem autor"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {formatDate(post.published_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              className="p-2 text-gray-600 hover:text-black transition-colors"
                              title="Ver post"
                            >
                              <Eye className="h-5 w-5" />
                            </Link>
                            <Link
                              href={`/admin/blog/${post.slug}/edit`}
                              className="p-2 text-gray-600 hover:text-black transition-colors"
                              title="Editar post"
                            >
                              <Edit className="h-5 w-5" />
                            </Link>
                            <button
                              onClick={() =>
                                handleDeleteClick(
                                  post.id,
                                  post.title,
                                  post.slug
                                )
                              }
                              disabled={deletingId === post.id}
                              className="p-2 text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
                              title="Excluir post"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={deleteModal.postTitle}
        description="Tem certeza que deseja excluir este post?"
        isLoading={deletingId !== null}
      />
    </AdminProtectedRoute>
  );
}
