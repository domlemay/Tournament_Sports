import Image from "next/image";
import Link from "next/link";
import NavbarAuth from "@/components/NavbarAuth";

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo/logoapp.png"
            alt="Logo"
            width={32}
            height={32}
            className="rounded-md"
          />
          <span className="text-sm font-semibold text-gray-900">
            Tournois Communautaires
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900">
            Profil
          </Link>
          <Link href="/teams" className="text-sm text-gray-600 hover:text-gray-900">
            Équipes
          </Link>
          <Link href="/my-requests" className="text-sm text-gray-600 hover:text-gray-900">
            Mes demandes
          </Link>
          <NavbarAuth />
        </div>
      </nav>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
