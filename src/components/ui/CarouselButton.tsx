interface CarouselButtonProps {
  direction: 'prev' | 'next';
  onClick: () => void;
  className?: string;
}

export function CarouselButton({ direction, onClick, className }: CarouselButtonProps) {
  const icon = direction === 'prev' ? (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  ) : (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  );

  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300 z-10 ${className}`}
      aria-label={direction === 'prev' ? 'Slide anterior' : 'Próximo slide'}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icon}
      </svg>
    </button>
  );
}
