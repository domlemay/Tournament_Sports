import Image from "next/image";
import Link from "next/link";
import NavbarAuth from "@/components/NavbarAuth";

export default function AuthLayout({
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
        <NavbarAuth />
      </nav>
      {children}
    </div>
  );
}
