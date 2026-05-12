import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import NavbarAuth from "@/components/NavbarAuth";

export default async function Home() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo/logoapp.png"
            alt="Logo"
            width={36}
            height={36}
            className="rounded-md"
          />
          <span className="text-sm font-semibold text-gray-900">
            Tournois Communautaires
          </span>
        </Link>

        <NavbarAuth />
      </nav>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center gap-6">
        <Image
          src="/logo/logoapp.png"
          alt="Logo Tournois Communautaires"
          width={120}
          height={120}
          className="rounded-2xl shadow-md"
        />
        <h1 className="text-3xl font-bold text-gray-900">
          Tournois Communautaires
        </h1>
        <p className="text-gray-500">
          Organise et participe à des tournois sportifs près de chez toi.
        </p>

        {isSignedIn ? (
          <Link
            href="/redirect"
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Aller à mon tableau de bord
          </Link>
        ) : (
          <div className="flex gap-3">
            <Link
              href="/sign-up"
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Commencer
            </Link>
            <Link
              href="/sign-in"
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Se connecter
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
