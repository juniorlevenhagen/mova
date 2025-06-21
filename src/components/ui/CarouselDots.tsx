interface CarouselDotsProps {
  totalSlides: number;
  currentIndex: number;
  onDotClick: (index: number) => void;
}

export function CarouselDots({
  totalSlides,
  currentIndex,
  onDotClick,
}: CarouselDotsProps) {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
      {Array.from({ length: totalSlides }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            index === currentIndex
              ? "bg-white scale-110"
              : "bg-white/50 hover:bg-white/75"
          }`}
          aria-label={`Ir para slide ${index + 1}`}
        />
      ))}
    </div>
  );
}
