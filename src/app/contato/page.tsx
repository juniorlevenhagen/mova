"use client";

import { useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Send } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function ContatoPage() {
  const heroReveal = useScrollReveal<HTMLElement>({ threshold: 0.1 });
  const formReveal = useScrollReveal<HTMLElement>({ threshold: 0.1 });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/send-contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar mensagem");
      }

      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-100">
      <Navbar />

      {/* Hero Section */}
      <section
        ref={heroReveal.ref}
        className={`w-full py-16 md:py-24 px-4 bg-gradient-to-b from-white via-white to-gray-100 transition-all duration-1000 ease-out ${
          heroReveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-gray-600 mb-8 tracking-wide uppercase bg-gradient-to-r from-black to-gray-800 text-white py-2 rounded-full w-56 mx-auto font-zalando relative overflow-hidden group shadow-lg">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
            <span className="relative z-10">Entre em Contato</span>
          </p>
          <h1 className="text-3xl md:text-6xl font-zalando-medium text-black mb-6 leading-tight">
            Entre em Contato
          </h1>
          <p className="text-lg md:text-xl text-black/90 mb-8 font-zalando">
            Estamos aqui para ajudar você em sua jornada fitness
          </p>
        </div>
      </section>

      {/* Contact Form */}
      <section
        ref={formReveal.ref}
        className={`w-full bg-white py-20 px-4 transition-all duration-1000 ease-out ${
          formReveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-3xl mx-auto">
          <div>
            <h2 className="text-3xl md:text-5xl font-zalando-medium text-black mb-8 text-center">
              Envie sua Mensagem
            </h2>

            {submitStatus === "success" && (
              <div className="bg-white rounded-[22px] border-2 border-green-500 p-4 mb-6">
                <p className="text-green-800 font-zalando">
                  ✅ Mensagem enviada com sucesso! Entraremos em contato em
                  breve.
                </p>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="bg-white rounded-[22px] border-2 border-red-500 p-4 mb-6">
                <p className="text-red-800 font-zalando">
                  ❌ Erro ao enviar mensagem. Tente novamente.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-zalando-medium text-black mb-2"
                  >
                    Nome *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-zalando"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-zalando-medium text-black mb-2"
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-zalando"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-zalando-medium text-black mb-2"
                >
                  Assunto *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-zalando"
                >
                  <option value="">Selecione um assunto</option>
                  <option value="suporte">Suporte Técnico</option>
                  <option value="planos">Dúvidas sobre Planos</option>
                  <option value="conta">Problemas com Conta</option>
                  <option value="pagamento">Dúvidas sobre Pagamento</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-zalando-medium text-black mb-2"
                >
                  Mensagem *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-zalando"
                  placeholder="Descreva sua dúvida ou problema..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white py-4 px-6 rounded-lg font-zalando-medium hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 border-2 border-black"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Enviar Mensagem</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
