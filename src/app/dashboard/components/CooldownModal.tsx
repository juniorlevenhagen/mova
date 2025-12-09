"use client";

import { useEffect, useState } from "react";

interface CooldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  hoursRemaining?: number;
  nextPlanAvailable?: string;
  availablePrompts?: number;
}

export function CooldownModal({
  isOpen,
  onClose,
  message,
  hoursRemaining = 0,
  nextPlanAvailable,
  availablePrompts = 0,
}: CooldownModalProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Função para calcular e atualizar tempo restante
    const updateTimer = () => {
      if (nextPlanAvailable) {
        const now = new Date();
        const nextDate = new Date(nextPlanAvailable);
        const diffMs = nextDate.getTime() - now.getTime();
        const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));

        const hours = Math.floor(diffHours);
        const minutes = Math.floor((diffHours - hours) * 60);

        if (diffHours <= 0) {
          setTimeRemaining("0m");
          return false; // Cooldown terminou
        } else if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else {
          setTimeRemaining(`${minutes}m`);
        }
        return true; // Ainda há tempo restante
      } else if (hoursRemaining && hoursRemaining > 0) {
        // Fallback: usar hoursRemaining se nextPlanAvailable não estiver disponível
        const hours = Math.floor(hoursRemaining);
        const minutes = Math.floor((hoursRemaining - hours) * 60);

        if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else {
          setTimeRemaining(`${minutes}m`);
        }
        return true;
      } else {
        setTimeRemaining("Calculando...");
        return true;
      }
    };

    // Atualizar imediatamente
    const stillActive = updateTimer();

    if (!stillActive) {
      onClose(); // Fechar modal se cooldown já terminou
      return;
    }

    // Atualizar contador a cada minuto
    const interval = setInterval(() => {
      const stillActive = updateTimer();
      if (!stillActive) {
        clearInterval(interval);
        onClose(); // Fechar modal quando cooldown terminar
      }
    }, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, [isOpen, hoursRemaining, nextPlanAvailable, onClose]);

  useEffect(() => {
    if (isOpen) {
      // Salvar a posição atual do scroll
      const scrollY = window.scrollY;

      // Bloquear scroll do body
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        // Restaurar scroll do body
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5 border-b border-amber-200 relative pr-12">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <svg
                    className="h-6 w-6 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Aguarde para Gerar Novo Plano
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Cooldown ativo para uso responsável dos prompts
                </p>
              </div>
            </div>
            {/* Botão X no canto superior direito */}
            <button
              onClick={onClose}
              className="absolute top-5 right-6 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fechar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {/* Mensagem Principal */}
            <div className="mb-6">
              <p className="text-gray-700 text-base leading-relaxed">
                {message}
              </p>
            </div>

            {/* Timer em Destaque */}
            <div className="mb-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 p-6">
              <div className="text-center">
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Tempo Restante:
                  </span>
                </div>
                <div className="text-4xl font-bold text-amber-600 mb-2">
                  {timeRemaining ||
                    `${Math.floor(hoursRemaining)}h ${Math.floor((hoursRemaining % 1) * 60)}m`}
                </div>
                {nextPlanAvailable && (
                  <div className="text-sm text-gray-500">
                    Disponível em:{" "}
                    <span className="font-medium text-gray-700">
                      {formatDate(nextPlanAvailable)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info sobre Prompts */}
            {availablePrompts > 0 && (
              <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-blue-800 font-medium mb-1">
                      Você ainda tem {availablePrompts} prompt
                      {availablePrompts > 1 ? "s" : ""} disponível
                      {availablePrompts > 1 ? "is" : ""}
                    </p>
                    <p className="text-xs text-blue-600">
                      Seus prompts estão seguros e aguardando o cooldown para
                      uso responsável.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Explicação do Cooldown */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong className="font-medium text-gray-700">
                  Por que o cooldown?
                </strong>
                <br />O cooldown de 24 horas garante que você tenha tempo
                adequado para implementar e testar cada plano antes de gerar um
                novo. Isso maximiza os resultados e garante um acompanhamento
                mais efetivo.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
