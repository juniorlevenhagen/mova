import Image from "next/image";

export function Logo() {
  return (
    <div className="absolute top-6 left-6 z-20">
      <Image
        src="/images/logo_white.svg"
        alt="Mova Logo"
        width={130}
        height={30}
        className="drop-shadow-2xl filter brightness-110"
      />
    </div>
  );
}
