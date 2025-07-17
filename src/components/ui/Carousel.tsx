"use client";

import { CarouselImage } from "@/types/carousel";
import { useCarousel } from "@/hooks/useCarousel";
import { CarouselDots } from "./CarouselDots";
import { CarouselSlide } from "./CarouselSlide";
import { Navbar } from "./Navbar";

// Dados das imagens do carrossel - agora tipado
const carouselImages: CarouselImage[] = [
  {
    src: "/images/carousel/carousel1.webp",
    alt: "Carrossel 1",
    scale: 1.0,
    message: {
      text: "Corpo forte, mente leve. \nBem-vindo ao Mova+",
      position: "bottom-left",
      style: "large",
      color: "",
    },
  },
  {
    src: "/images/carousel/carousel2.webp",
    alt: "Carrossel 2",
    scale: 1.0,
    objectPosition: "center 60%",
    message: {
      text: "Mais que treinar, \né sobre evoluir \npor inteiro.",
      position: "bottom-right",
      style: "large",
      color: "",
    },
  },
  {
    src: "/images/carousel/carousel3.webp",
    alt: "Carrossel 3",
    scale: 1.0,
    objectPosition: "center 30%",
    message: {
      text: "Seu corpo é o seu templo. \nVamos cuidar dele juntos.",
      position: "top-left",
      style: "large",
      color: "",
    },
  },
  {
    src: "/images/carousel/carousel5.webp",
    alt: "Carrossel 5",
    scale: 1.0,
    objectPosition: "center 55%",
    message: {
      text: "Aqui, o movimento \ntransforma tudo.",
      position: "top-right",
      style: "large",
      color: "",
    },
  },
  {
    src: "/images/carousel/carousel6.webp",
    alt: "Carrossel 6",
    scale: 1.0,
    objectPosition: "center 20%",
    message: {
      text: "Comece hoje. \nVem pro Mova+",
      position: "center",
      style: "large",
      color: "",
    },
  },
];

export default function Carousel() {
  const { currentIndex, goToSlide } = useCarousel(carouselImages.length);

  return (
    <div className="w-full bg-[#f5f1e8]">
      {/* Navbar */}
      <Navbar />

      {/* Carrossel */}
      <div className="relative w-full h-[60vh] overflow-hidden">
        <div className="relative w-full h-full">
          {carouselImages.map((image, index) => (
            <CarouselSlide
              key={index}
              image={image}
              isActive={index === currentIndex}
            />
          ))}
        </div>

        <CarouselDots
          totalSlides={carouselImages.length}
          currentIndex={currentIndex}
          onDotClick={goToSlide}
        />
      </div>
    </div>
  );
}
