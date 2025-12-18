"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseType: "single" | "triple";
  onPaymentSuccess: () => void;
}

export function PixPaymentModal({
  isOpen,
  onClose,
  purchaseType,
  onPaymentSuccess,
}: PixPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    payment_id: string;
    qr_code: string;
    qr_code_base64: string;
    pix_code: string;
    amount: number;
    expires_at: string;
  } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "approved" | "expired"
  >("pending");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // Criar pagamento ao abrir o modal
  useEffect(() => {
    if (isOpen && !paymentData && !loading) {
      createPayment();
    }
    // Resetar ao fechar
    if (!isOpen) {
      setPaymentData(null);
      setPaymentStatus("pending");
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Verificar status do pagamento periodicamente
  useEffect(() => {
    if (!paymentData || paymentStatus !== "pending") return;

    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentData, paymentStatus]);

  // Atualizar contador de expiração a cada segundo
  useEffect(() => {
    if (!paymentData || paymentStatus !== "pending") {
      setTimeRemaining("");
      return;
    }

    const updateTimer = () => {
      setTimeRemaining(formatExpirationTime(paymentData.expires_at));
    };

    // Atualizar imediatamente
    updateTimer();

    // Atualizar a cada segundo
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [paymentData, paymentStatus]);

  const createPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Usuário não autenticado");
      }

      const response = await fetch("/api/create-pix-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: purchaseType === "single" ? "prompt_single" : "prompt_triple",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar pagamento");
      }

      const data = await response.json();
      setPaymentData(data);
      setPaymentStatus("pending");
    } catch (err) {
      console.error("Erro ao criar pagamento PIX:", err);
      setError(
        err instanceof Error ? err.message : "Erro ao processar pagamento"
      );
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentData) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch("/api/verify-pix-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          payment_id: paymentData.payment_id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentStatus(data.status);

        if (data.status === "approved") {
          onPaymentSuccess();
          setTimeout(() => {
            onClose();
          }, 4000);
        } else if (data.status === "expired") {
          setError("O pagamento expirou. Por favor, gere um novo QR Code.");
        }
      }
    } catch (err) {
      console.error("Erro ao verificar pagamento:", err);
    }
  };

  const copyPixCode = () => {
    if (!paymentData?.pix_code) return;

    navigator.clipboard.writeText(paymentData.pix_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatExpirationTime = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return "Expirado";

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
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

        <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Pagamento via PIX
        </h3>

        {loading && !paymentData && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Gerando QR Code...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
            {paymentStatus === "expired" && (
              <button
                onClick={createPayment}
                className="mt-2 text-red-800 text-sm font-medium hover:underline"
              >
                Gerar novo QR Code
              </button>
            )}
          </div>
        )}

        {paymentData && paymentStatus === "pending" && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Escaneie o QR Code com o app do seu banco ou copie o código PIX
              </p>

              {/* QR Code */}
              {paymentData.qr_code_base64 ? (
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
                  <Image
                    src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                    alt="QR Code PIX"
                    width={256}
                    height={256}
                    unoptimized
                    className="w-64 h-64"
                  />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 mb-4">
                  <p className="text-gray-500 text-sm">
                    QR Code não disponível. Use o código abaixo.
                  </p>
                </div>
              )}

              {/* Código PIX */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-600 mb-2">Código PIX:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white p-2 rounded border break-all">
                    {paymentData.pix_code}
                  </code>
                  <button
                    onClick={copyPixCode}
                    className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors whitespace-nowrap"
                  >
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>

              {/* Valor */}
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">Valor:</p>
                <p className="text-2xl font-bold text-black">
                  R$ {paymentData.amount.toFixed(2).replace(".", ",")}
                </p>
              </div>

              {/* Tempo de expiração */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">
                  Tempo restante para pagamento:
                </p>
                <p className="text-lg font-semibold text-red-600">
                  {timeRemaining ||
                    formatExpirationTime(paymentData.expires_at)}
                </p>
              </div>

              {/* Status de verificação */}
              <div className="text-center pt-4 border-t">
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  <p className="text-sm">Aguardando pagamento...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {paymentStatus === "approved" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              Pagamento Aprovado!
            </h4>
            <p className="text-gray-600">
              Seus prompts foram adicionados com sucesso.
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
          >
            {paymentStatus === "approved" ? "Fechar" : "Cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}
