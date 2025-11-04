"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, CheckCircle2, Eye, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  postSlug?: string;
  redirectTo?: string;
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  postSlug,
  redirectTo,
}: SuccessModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleContinue = () => {
    if (redirectTo) {
      router.push(redirectTo);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-md transform overflow-hidden rounded-[24px] border-2 border-black bg-white text-left shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-gray-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-zalando-medium text-black">
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 transition-colors hover:text-black"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <p className="text-base text-gray-700 mb-6">
              {message}
            </p>

            {/* Links de ação */}
            <div className="space-y-3">
              {postSlug && (
                <Link
                  href={`/blog/${postSlug}`}
                  target="_blank"
                  className="flex items-center justify-between w-full px-4 py-3 border-2 border-black rounded-lg hover:bg-black hover:text-white transition-all group"
                >
                  <span className="flex items-center gap-2 font-zalando font-semibold">
                    <Eye className="h-4 w-4" />
                    Ver post publicado
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
              
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <p className="text-sm text-green-800">
                  O post foi salvo e está disponível na lista de posts.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t-2 border-gray-200 bg-gray-50 px-6 py-4">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-zalando font-semibold text-gray-700 border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-white transition-all"
            >
              Fechar
            </button>
            <button
              onClick={handleContinue}
              className="px-5 py-2.5 text-sm font-zalando font-semibold text-white bg-black rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              {redirectTo ? "Ir para lista" : "Continuar"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

