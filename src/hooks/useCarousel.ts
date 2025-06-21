import { useState, useEffect } from "react";

export function useCarousel(totalSlides: number, interval: number = 20000) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === totalSlides - 1 ? 0 : prevIndex + 1
      );
    }, interval);

    return () => clearInterval(timer);
  }, [totalSlides, interval]);

  const goToSlide = (index: number) => setCurrentIndex(index);
  const goToPrevious = () =>
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  const goToNext = () =>
    setCurrentIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));

  return { currentIndex, goToSlide, goToPrevious, goToNext };
}
