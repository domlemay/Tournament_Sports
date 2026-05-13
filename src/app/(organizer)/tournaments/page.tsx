import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

async function getTournaments() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const organizer = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!organizer || organizer.role !== "ORGANIZER") redirect("/dashboard");

  return prisma.tournament.findMany({
    where: { organizerId: organizer.id },
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
}

export default async function TournamentsPage() {
  const tournaments = await getTournaments();

  return (
    <div className="py-4 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-700">Mes tournois</h1>
          <p className="mt-1 text-sm text-ink-500">
            Gère tes tournois et leurs équipes.
          </p>
        </div>
        <Link
          href="/tournaments/new"
          className="rounded-lg bg-navy-700 text-white text-sm font-semibold px-4 py-2 hover:bg-navy-800 transition-colors shrink-0"
        >
          + Nouveau tournoi
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <div className="rounded-2xl border border-ink-100 bg-surface shadow-sm p-14 text-center">
          <p className="text-sm text-ink-500 mb-3">Aucun tournoi pour le moment.</p>
          <Link
            href="/tournaments/new"
            className="text-sm font-medium text-navy-700 underline hover:text-navy-800"
          >
            Créer ton premier tournoi →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => {
            const pendingRequests = t.teams.reduce(
              (sum, team) => sum + team._count.joinRequests,
              0
            );
            const startDate = new Date(t.startDate).toLocaleDateString("fr-CA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            return (
              <div
                key={t.id}
                className="rounded-2xl border border-ink-100 bg-surface shadow-sm p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-navy-700">{t.name}</h2>
                      {pendingRequests > 0 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          {pendingRequests} en attente
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ink-500">
                      {t.sport} · {t.city} · {startDate}
                    </p>
                    <p className="text-xs text-ink-400">
                      {t._count.teams} équipe{t._count.teams !== 1 ? "s" : ""}
                      {t.entryFee > 0
                        ? ` · Frais : ${t.entryFee} ${t.currency}`
                        : " · Gratuit"}
                    </p>
                  </div>

                  <Link
                    href={`/tournaments/${t.id}`}
                    className="rounded-lg border border-navy-200 bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-navy-100 transition-colors shrink-0"
                  >
                    Gérer →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
