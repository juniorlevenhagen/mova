// Definições de tipos para o carrossel
export interface CarouselMessage {
  text: string;
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center"
    | "default";
  style: "large" | "medium" | "small";
  color?: string;
}

export interface CarouselImage {
  src: string;
  alt: string;
  scale?: number;
  objectPosition?: string;
  message?: CarouselMessage;
}

export interface CarouselProps {
  images: CarouselImage[];
  autoPlay?: boolean;
  interval?: number;
}

// Tipos para as funções de posicionamento e estilo
export type PositionType = CarouselMessage["position"];
export type StyleType = CarouselMessage["style"];
