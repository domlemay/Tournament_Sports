import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NavbarAuth from "@/components/NavbarAuth";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminTournamentPage({ params }: PageProps) {
  const { id } = await params;

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.role !== "ADMIN") redirect("/");

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      organizer: { select: { fullName: true, email: true } },
      teams: {
        include: {
          members: { select: { id: true, fullName: true } },
          _count: {
            select: {
              members: true,
              joinRequests: { where: { status: "PENDING" } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!tournament) redirect("/admin");

  const matches = await prisma.match.findMany({
    where: { teamA: { tournamentId: id } },
    include: {
      teamA: { select: { id: true, name: true } },
      teamB: { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
  });

  const totalPending = tournament.teams.reduce(
    (sum, t) => sum + t._count.joinRequests,
    0
  );

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
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-sm font-medium text-ink-500 hover:text-navy-700 transition-colors"
            >
              ← Administration
            </Link>
            <div className="border-l border-ink-200 pl-4">
              <NavbarAuth />
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8">
        <div className="py-4 space-y-8">
          {/* Tournament info */}
          <div>
            <h1 className="text-2xl font-bold text-navy-700">
              {tournament.name}
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              {tournament.sport} · {tournament.city} ·{" "}
              {tournament.startDate.toLocaleDateString("fr-CA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {tournament.entryFee > 0 &&
                ` · ${tournament.entryFee} ${tournament.currency}`}
            </p>
          </div>

          {/* Organizer info */}
          <div className="rounded-2xl border border-ink-100 bg-surface shadow-sm p-6">
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">
              Organisateur
            </p>
            <p className="font-medium text-navy-700">
              {tournament.organizer.fullName}
            </p>
            <p className="text-sm text-ink-500">{tournament.organizer.email}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Équipes", value: tournament.teams.length },
              { label: "Matchs", value: matches.length },
              { label: "Demandes en attente", value: totalPending },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-ink-100 bg-surface shadow-sm p-5 text-center"
              >
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="mt-1 font-display text-4xl text-navy-700">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Teams */}
          <div>
            <h2 className="text-lg font-semibold text-navy-700 mb-4">
              Équipes ({tournament.teams.length})
            </h2>
            {tournament.teams.length === 0 ? (
              <div className="rounded-2xl border border-ink-100 bg-surface shadow-sm p-8 text-center text-sm text-ink-500">
                Aucune équipe.
              </div>
            ) : (
              <div className="space-y-3">
                {tournament.teams.map((team) => (
                  <div
                    key={team.id}
                    className="rounded-2xl border border-ink-100 bg-surface shadow-sm px-6 py-4"
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium text-navy-700">
                          {team.name}
                        </span>
                        <span className="text-sm text-ink-500 tabular-nums">
                          {team._count.members}/{team.maxCapacity} joueurs
                        </span>
                        {team._count.joinRequests > 0 && (
                          <span className="inline-flex items-center rounded-full bg-warning-100 px-2 py-0.5 text-xs font-semibold text-warning-600">
                            {team._count.joinRequests} en attente
                          </span>
                        )}
                      </div>
                    </div>
                    {team.members.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-ink-100">
                        <ul className="flex flex-wrap gap-2">
                          {team.members.map((m) => (
                            <li
                              key={m.id}
                              className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700"
                            >
                              {m.fullName}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Matches */}
          <div>
            <h2 className="text-lg font-semibold text-navy-700 mb-4">
              Matchs ({matches.length})
            </h2>
            {matches.length === 0 ? (
              <div className="rounded-2xl border border-ink-100 bg-surface shadow-sm p-8 text-center text-sm text-ink-500">
                Aucun match.
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => {
                  const hasScore =
                    match.scoreA !== null && match.scoreB !== null;
                  return (
                    <div
                      key={match.id}
                      className="rounded-2xl border border-ink-100 bg-surface shadow-sm px-6 py-4"
                    >
                      <p className="font-medium text-navy-700">
                        {match.teamA.name}{" "}
                        {hasScore ? (
                          <span className="font-display text-lg">
                            {match.scoreA}&nbsp;–&nbsp;{match.scoreB}
                          </span>
                        ) : (
                          <span className="text-ink-300 font-normal text-sm">
                            vs
                          </span>
                        )}{" "}
                        {match.teamB.name}
                      </p>
                      <p className="text-sm text-ink-500 mt-0.5">
                        {match.date.toLocaleDateString("fr-CA", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        à{" "}
                        {match.date.toLocaleTimeString("fr-CA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {match.location}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
