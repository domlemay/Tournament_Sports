import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

async function getDashboardData() {
  const tournaments = await prisma.tournament.findMany({
    where: { organizer: { clerkId: await getCurrentUserId() } },
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
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-10">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Tableau de bord
        </h1>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6"
            >
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {stat.label}
              </p>
              <p className="mt-2 text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Liste des tournois */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Mes tournois
            </h2>
            <Link
              href="/tournaments/new"
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold px-4 py-2 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
            >
              + Nouveau tournoi
            </Link>
          </div>

          {tournaments.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-12 text-center">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Aucun tournoi pour le moment.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <th className="text-left px-6 py-3.5 font-medium text-zinc-500 dark:text-zinc-400">
                      Tournoi
                    </th>
                    <th className="text-left px-6 py-3.5 font-medium text-zinc-500 dark:text-zinc-400">
                      Sport
                    </th>
                    <th className="text-left px-6 py-3.5 font-medium text-zinc-500 dark:text-zinc-400">
                      Ville
                    </th>
                    <th className="text-left px-6 py-3.5 font-medium text-zinc-500 dark:text-zinc-400">
                      Date
                    </th>
                    <th className="text-left px-6 py-3.5 font-medium text-zinc-500 dark:text-zinc-400">
                      Équipes
                    </th>
                    <th className="text-left px-6 py-3.5 font-medium text-zinc-500 dark:text-zinc-400">
                      Frais
                    </th>
                    <th className="text-right px-6 py-3.5 font-medium text-zinc-500 dark:text-zinc-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map((t, i) => (
                    <tr
                      key={t.id}
                      className={
                        i < tournaments.length - 1
                          ? "border-b border-zinc-100 dark:border-zinc-800"
                          : ""
                      }
                    >
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                        {t.name}
                        {t.pendingRequests > 0 && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                            {t.pendingRequests} en attente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                        {t.sport}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                        {t.city}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                        {t.startDate.toLocaleDateString("fr-CA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                        {t.teamCount}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                        {t.entryFee === 0
                          ? "Gratuit"
                          : `${t.entryFee} ${t.currency}`}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/tournaments/${t.id}`}
                          className="rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
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
    </main>
  );
}
async function getCurrentUserId(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated.");
  }

  return userId;
}

