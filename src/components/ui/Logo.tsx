import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <div className="absolute top-6 left-6 z-20">
      <Link href="/">
        <Image
          src="/images/logo_white.webp"
          alt="Mova Logo"
          width={120}
          height={40}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        />
      </Link>
    </div>
  );
}
