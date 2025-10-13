"use client";

import { useState } from "react";
import Image from "next/image";

export function FeaturesSection() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="w-full bg-white px-4">
      <div className="max-w-4xl mx-auto flex justify-center items-center">
        <div
          className="relative w-full max-w-3xl transition-all duration-500 ease-out"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            transform: isHovered
              ? "scale(1.05) translateY(-10px)"
              : "scale(1) translateY(0)",
          }}
        >
          <Image
            src="/images/cellphone_image1.webp"
            alt="Features do Mova+ - Interface do aplicativo"
            width={1200}
            height={1600}
            priority
            quality={90}
            className={`w-full h-auto rounded-[50px] transition-all duration-500
                       ${isHovered ? "shadow-2xl" : "shadow-lg"}`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />

          {/* Brilho sutil no hover */}
          <div
            className="absolute inset-0 rounded-[50px] pointer-events-none transition-opacity duration-500"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)",
              opacity: isHovered ? 1 : 0,
            }}
          />
        </div>
      </div>
    </section>
  );
}
