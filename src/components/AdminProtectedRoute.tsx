"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminProtectedRoute({
  children,
  fallback,
}: AdminProtectedRouteProps) {
  const { isAdmin, loading, user } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Se não está autenticado, redireciona para login
        router.push("/auth/login?redirect=/admin/blog");
        return;
      }
      if (!isAdmin) {
        // Se está autenticado mas não é admin, redireciona para dashboard
        router.push("/dashboard");
        return;
      }
    }
  }, [isAdmin, loading, user, router]);

  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando permissões...</p>
          </div>
        </div>
      )
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
