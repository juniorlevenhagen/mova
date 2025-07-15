import Image from "next/image";
import Link from "next/link";

export function LogoBlue() {
  return (
    <div className="absolute top-6 left-6 z-20">
      <Link href="/">
        <Image
          src="/images/logo_blue.svg"
          alt="Mova+ Logo"
          width={120}
          height={40}
          className="h-6 w-auto drop-shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
        />
      </Link>
    </div>
  );
}
