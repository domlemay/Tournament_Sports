import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NavbarAuth from "@/components/NavbarAuth";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.role !== "ADMIN") redirect("/");

  const tournaments = await prisma.tournament.findMany({
    include: {
      organizer: { select: { fullName: true, email: true } },
      _count: { select: { teams: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalTeams = tournaments.reduce((sum, t) => sum + t._count.teams, 0);

  const stats = [
    { label: "Tournois", value: tournaments.length },
    { label: "Équipes", value: totalTeams },
    { label: "Organisateurs", value: new Set(tournaments.map((t) => t.organizerId)).size },
  ];

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
            <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 uppercase tracking-wide">
              Admin
            </span>
          </Link>
          <div className="ml-2 border-l border-ink-200 pl-4">
            <NavbarAuth />
          </div>
        </nav>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8">
        <div className="py-4 space-y-10">
          <div>
            <h1 className="text-2xl font-bold text-navy-700">Administration</h1>
            <p className="mt-1 text-sm text-ink-500">
              Vue globale de tous les tournois de la plateforme.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-ink-100 bg-surface shadow-sm p-6"
              >
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="mt-2 font-display text-5xl text-navy-700">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* All tournaments */}
          <div>
            <h2 className="text-lg font-semibold text-navy-700 mb-4">
              Tous les tournois
            </h2>

            {tournaments.length === 0 ? (
              <div className="rounded-2xl border border-ink-100 bg-surface shadow-sm p-14 text-center">
                <p className="text-sm text-ink-500">
                  Aucun tournoi sur la plateforme.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-ink-100 bg-surface shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-100">
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-ink-400 uppercase tracking-wide">
                        Tournoi
                      </th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-ink-400 uppercase tracking-wide">
                        Sport / Ville
                      </th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-ink-400 uppercase tracking-wide">
                        Date
                      </th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-ink-400 uppercase tracking-wide">
                        Organisateur
                      </th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-ink-400 uppercase tracking-wide">
                        Équipes
                      </th>
                      <th className="text-right px-6 py-3.5 text-xs font-semibold text-ink-400 uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournaments.map((t, i) => (
                      <tr
                        key={t.id}
                        className={`hover:bg-navy-50 transition-colors ${
                          i < tournaments.length - 1
                            ? "border-b border-ink-100"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 font-medium text-navy-700">
                          {t.name}
                          {t.entryFee > 0 && (
                            <span className="ml-2 text-xs text-ink-400 font-normal tabular-nums">
                              {t.entryFee} {t.currency}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-ink-600">
                          {t.sport} · {t.city}
                        </td>
                        <td className="px-6 py-4 text-ink-600">
                          {t.startDate.toLocaleDateString("fr-CA", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-ink-600 truncate max-w-[160px]">
                          {t.organizer.fullName}
                        </td>
                        <td className="px-6 py-4 text-ink-600 tabular-nums">
                          {t._count.teams}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/tournaments/${t.id}`}
                            className="rounded-md border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-navy-50 hover:text-navy-700 hover:border-navy-200 transition-colors"
                          >
                            Voir
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
