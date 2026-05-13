import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface Props {
  searchParams: Promise<{ filter?: string }>;
}

export default async function MatchesPage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  const sp = await searchParams;
  const filter = sp.filter === "past" ? "past" : "upcoming";
  const now = new Date();

  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { teamA: { members: { some: { id: user.id } } } },
        { teamB: { members: { some: { id: user.id } } } },
      ],
      date: filter === "past" ? { lt: now } : { gte: now },
    },
    include: {
      teamA: {
        select: {
          id: true,
          name: true,
          members: { where: { id: user.id }, select: { id: true } },
          tournament: { select: { name: true } },
        },
      },
      teamB: {
        select: {
          id: true,
          name: true,
          members: { where: { id: user.id }, select: { id: true } },
          tournament: { select: { name: true } },
        },
      },
    },
    orderBy: { date: filter === "past" ? "desc" : "asc" },
  });

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Mes matchs
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Matchs des équipes dont vous faites partie.
          </p>
        </div>

        {/* Filter toggle */}
        <div className="flex gap-2">
          <Link
            href="/matches?filter=upcoming"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === "upcoming"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            }`}
          >
            À venir
          </Link>
          <Link
            href="/matches?filter=past"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === "past"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            }`}
          >
            Passés
          </Link>
        </div>

        {/* Match list */}
        {matches.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {filter === "upcoming"
                ? "Aucun match à venir pour vos équipes."
                : "Aucun match passé pour vos équipes."}
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {matches.map((match) => {
              const isInTeamA = match.teamA.members.length > 0;
              const myTeam = isInTeamA ? match.teamA : match.teamB;
              const opponent = isInTeamA ? match.teamB : match.teamA;
              const hasScore =
                match.scoreA !== null && match.scoreB !== null;
              const myScore = isInTeamA ? match.scoreA : match.scoreB;
              const oppScore = isInTeamA ? match.scoreB : match.scoreA;

              const matchDate = new Date(match.date);
              const dateStr = matchDate.toLocaleDateString("fr-CA", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              const timeStr = matchDate.toLocaleTimeString("fr-CA", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <li
                  key={match.id}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                        {myTeam.tournament.name}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        <span>{myTeam.name}</span>
                        <span className="text-zinc-400 dark:text-zinc-500 font-normal">
                          vs
                        </span>
                        <span>{opponent.name}</span>
                      </div>
                    </div>

                    {hasScore && (
                      <div className="text-right">
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-0.5">
                          Score final
                        </p>
                        <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                          {myScore}&nbsp;–&nbsp;{oppScore}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                    <span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        Date :
                      </span>{" "}
                      {dateStr}
                    </span>
                    <span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        Heure :
                      </span>{" "}
                      {timeStr}
                    </span>
                    <span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        Lieu :
                      </span>{" "}
                      {match.location}
                    </span>
                  </div>

                  {!hasScore && filter === "upcoming" && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                      Score non encore saisi
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
