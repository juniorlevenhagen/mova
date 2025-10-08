"use client";

import Image from "next/image";

export function FeaturesSection() {
  return (
    <section className="w-full bg-white px-4">
      <div className="max-w-4xl mx-auto flex justify-center items-center">
        <Image
          src="/images/cellphone_image1.webp"
          alt="Features"
          width={800}
          height={600}
          className="w-full max-w-3xl h-auto rounded-[50px] shadow-lg"
        />
      </div>
    </section>
  );
}
