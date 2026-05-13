import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const tournaments = await prisma.tournament.findMany({
    where: { organizer: { clerkId: userId } },
    include: {
      _count: { select: { teams: true } },
      teams: {
        include: {
          _count: {
            select: { joinRequests: { where: { status: "PENDING" } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return tournaments.map((t) => ({
    id: t.id,
    name: t.name,
    sport: t.sport,
    city: t.city,
    startDate: t.startDate,
    entryFee: t.entryFee,
    currency: t.currency,
    teamCount: t._count.teams,
    pendingRequests: t.teams.reduce(
      (sum, team) => sum + team._count.joinRequests,
      0
    ),
  }));
}

export default async function DashboardPage() {
  const tournaments = await getDashboardData();

  const totalTeams = tournaments.reduce((sum, t) => sum + t.teamCount, 0);
  const totalPending = tournaments.reduce((sum, t) => sum + t.pendingRequests, 0);

  const stats = [
    { label: "Tournois créés", value: tournaments.length },
    { label: "Équipes au total", value: totalTeams },
    { label: "Demandes en attente", value: totalPending },
  ];

  return (
    <div className="py-4 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-navy-700">Tableau de bord</h1>
        <p className="mt-1 text-sm text-ink-500">
          Vue d&apos;ensemble de tes tournois et des demandes en attente.
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

      {/* Tournaments list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-navy-700">Mes tournois</h2>
          <Link
            href="/tournaments/new"
            className="rounded-lg bg-navy-700 text-white text-sm font-semibold px-4 py-2 hover:bg-navy-800 transition-colors"
          >
            + Nouveau tournoi
          </Link>
        </div>

        {tournaments.length === 0 ? (
          <div className="rounded-2xl border border-ink-100 bg-surface shadow-sm p-14 text-center">
            <p className="text-sm text-ink-500">Aucun tournoi pour le moment.</p>
            <Link
              href="/tournaments/new"
              className="mt-3 inline-block text-sm font-medium text-navy-700 underline hover:text-navy-800"
            >
              Créer ton premier tournoi
            </Link>
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
                    Sport
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-ink-400 uppercase tracking-wide">
                    Ville
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-ink-400 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-ink-400 uppercase tracking-wide">
                    Équipes
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-ink-400 uppercase tracking-wide">
                    Frais
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
                      {t.pendingRequests > 0 && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-warning-100 px-2 py-0.5 text-xs font-semibold text-warning-600">
                          {t.pendingRequests} en attente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-ink-600">{t.sport}</td>
                    <td className="px-6 py-4 text-ink-600">{t.city}</td>
                    <td className="px-6 py-4 text-ink-600">
                      {t.startDate.toLocaleDateString("fr-CA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-ink-600 tabular-nums">
                      {t.teamCount}
                    </td>
                    <td className="px-6 py-4 text-ink-600">
                      {t.entryFee === 0
                        ? "Gratuit"
                        : `${t.entryFee} ${t.currency}`}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/tournaments/${t.id}`}
                        className="rounded-md border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-navy-50 hover:text-navy-700 hover:border-navy-200 transition-colors"
                      >
                        Gérer
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
  );
}
