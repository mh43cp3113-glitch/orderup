import Image from "next/image";

export function ClientBranding({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl: string | null;
  className?: string;
}) {
  if (logoUrl) {
    return (
      <div className={className}>
        <Image
          src={logoUrl}
          alt={name}
          width={128}
          height={32}
          className="h-8 w-auto object-contain"
          unoptimized
        />
      </div>
    );
  }

  return (
    <p className={className}>
      <span className="font-semibold">{name}</span>
    </p>
  );
}
