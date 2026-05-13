import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import NavbarAuth from "@/components/NavbarAuth";

export default async function Home() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-navy-100 bg-surface shadow-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
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
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-navy-700 shadow-lg">
          <Image
            src="/logo/logoapp.png"
            alt="Logo Tournois Communautaires"
            width={48}
            height={48}
            className="rounded-xl"
          />
        </div>

        <h1 className="font-display text-6xl tracking-wide text-navy-700 sm:text-7xl">
          Tournois Communautaires
        </h1>

        <p className="mt-4 max-w-md text-base text-ink-500">
          Organise et participe à des tournois sportifs près de chez toi.
          Soccer, basketball, hockey, volleyball — trouve ton équipe.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {isSignedIn ? (
            <Link
              href="/redirect"
              className="rounded-lg bg-red-500 px-7 py-3 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
            >
              Aller à mon tableau de bord
            </Link>
          ) : (
            <>
              <Link
                href="/sign-up"
                className="rounded-lg bg-red-500 px-7 py-3 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
              >
                Commencer gratuitement
              </Link>
              <Link
                href="/sign-in"
                className="rounded-lg border border-navy-200 bg-surface px-7 py-3 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition-colors"
              >
                Se connecter
              </Link>
            </>
          )}
        </div>
      </main>

      {/* Features */}
      <section className="border-t border-navy-100 bg-surface-alt py-16 px-6">
        <div className="mx-auto max-w-4xl grid grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            {
              title: "Crée ton tournoi",
              desc: "Configure le sport, le format, les frais d'inscription et les équipes en quelques minutes.",
            },
            {
              title: "Rejoins une équipe",
              desc: "Parcours les équipes disponibles, envoie une demande et paye en ligne si requis.",
            },
            {
              title: "Suis les matchs",
              desc: "Consulte le calendrier, les scores et les résultats de tes équipes en temps réel.",
            },
          ].map((f) => (
            <div key={f.title} className="space-y-2">
              <div className="h-1 w-8 rounded-full bg-red-500" />
              <h3 className="text-sm font-bold text-navy-700">{f.title}</h3>
              <p className="text-sm text-ink-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-navy-100 py-6 text-center text-xs text-ink-400">
        © {new Date().getFullYear()} Tournois Communautaires
      </footer>
    </div>
  );
}
