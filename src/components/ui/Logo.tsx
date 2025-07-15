import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <div className="absolute top-6 left-6 z-20">
      <Link href="/">
        <Image
          src="/images/logo_white.svg"
          alt="Mova Logo"
          width={130}
          height={30}
          className="drop-shadow-2xl filter brightness-110 cursor-pointer hover:opacity-80 transition-opacity"
        />
      </Link>
    </div>
  );
}
