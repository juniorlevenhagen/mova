"use client";

import Image from "next/image";

interface FeatureCardProps {
  title: string;
  description: string;
  backgroundImage: string;
}

export function FeatureCard({
  title,
  description,
  backgroundImage,
}: FeatureCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
      {/* Imagem */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={backgroundImage}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      
      {/* Conteúdo abaixo da imagem */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
