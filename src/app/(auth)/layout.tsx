import Image from "next/image";
import Link from "next/link";
import NavbarAuth from "@/components/NavbarAuth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <nav className="flex items-center justify-between border-b border-navy-100 bg-surface px-6 py-3 shadow-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo/logoapp.png"
            alt="Logo"
            width={32}
            height={32}
            className="rounded-md"
          />
          <span className="text-sm font-bold text-navy-700 tracking-tight">
            Tournois Communautaires
          </span>
        </Link>
        <NavbarAuth />
      </nav>
      {children}
    </div>
  );
}
