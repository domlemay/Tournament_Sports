import Image from "next/image";
import Link from "next/link";
import NavbarAuth from "@/components/NavbarAuth";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = userId
    ? await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { role: true },
      })
    : null;
  const isOrganizer = user?.role === "ORGANIZER";

  return (
    <div className="flex min-h-screen flex-col bg-paper">
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

          <div className="flex items-center gap-1">
            <Link
              href="/teams"
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-500 hover:bg-navy-50 hover:text-navy-700 transition-colors"
            >
              Équipes
            </Link>
            <Link
              href="/matches"
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-500 hover:bg-navy-50 hover:text-navy-700 transition-colors"
            >
              Mes matchs
            </Link>
            <Link
              href="/my-requests"
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-500 hover:bg-navy-50 hover:text-navy-700 transition-colors"
            >
              Mes demandes
            </Link>
            <Link
              href="/profile"
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-500 hover:bg-navy-50 hover:text-navy-700 transition-colors"
            >
              Profil
            </Link>
            {isOrganizer && (
              <Link
                href="/dashboard"
                className="ml-2 rounded-full border border-navy-200 bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-navy-100 transition-colors"
              >
                Espace organisateur →
              </Link>
            )}
            <div className="ml-2 border-l border-ink-200 pl-4">
              <NavbarAuth />
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}
