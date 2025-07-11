"use client";

import { useEffect, useRef, useState } from "react";
import { FeatureCard } from "./FeatureCard";

const features = [
  {
    title: "Treinos Personalizados",
    description:
      "Programas adaptados ao seu nível e objetivos, com progressão inteligente.",
    backgroundImage: "/images/feature-card-1.webp",
  },
  {
    title: "Progresso Inteligente",
    description:
      "Monitore seu progresso com métricas avançadas e insights personalizados.",
    backgroundImage: "/images/feature-card-2.webp",
  },
  {
    title: "Nutrição",
    description:
      "Planos alimentares personalizados que complementam seus treinos.",
    backgroundImage: "/images/feature-card-3.webp",
  },
  {
    title: "Comunidade Fitness",
    description:
      "Conecte-se com outros usuários e compartilhe suas conquistas.",
    backgroundImage: "/images/feature-card-4.webp",
  },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-white py-16 md:py-24 lg:py-32 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`
                transition-all duration-700 ease-out
                ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }
              `}
              style={{
                transitionDelay: isVisible ? `${index * 150 + 200}ms` : "0ms",
              }}
            >
              <FeatureCard
                title={feature.title}
                description={feature.description}
                backgroundImage={feature.backgroundImage}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
