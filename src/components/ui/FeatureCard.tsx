"use client";

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
    <div className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
      <div className="relative h-48 md:h-56 lg:h-64">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      </div>
      <div className="p-6 md:p-8">
        <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-3 md:mb-4">
          {title}
        </h3>
        <p className="text-sm md:text-base lg:text-lg text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
