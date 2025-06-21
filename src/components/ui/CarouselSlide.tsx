import Image from "next/image";
import { CarouselImage } from "@/types/carousel";
import { getPositionClass, getStyleClass } from "@/lib/carousel-utils";

interface CarouselSlideProps {
  image: CarouselImage;
  isActive: boolean;
}

export function CarouselSlide({ image, isActive }: CarouselSlideProps) {
  return (
    <div
      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
        isActive ? "opacity-100" : "opacity-0"
      }`}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        className="object-cover transition-transform duration-700"
        style={{
          transform: `scale(${image.scale || 1})`,
          objectPosition: image.objectPosition || "center",
        }}
        priority={isActive}
      />

      {image.message && (
        <div className={`absolute ${getPositionClass(image.message.position)}`}>
          <div className={`text-white ${getStyleClass(image.message.style)} whitespace-pre-line`}>
            {image.message.text}
          </div>
        </div>
      )}
    </div>
  );
}
