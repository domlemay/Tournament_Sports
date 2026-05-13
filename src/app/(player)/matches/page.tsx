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
    <div className="py-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-700">Mes matchs</h1>
        <p className="mt-1 text-sm text-ink-500">
          Matchs des équipes dont tu fais partie.
        </p>
      </div>

      {/* Filtre */}
      <div className="flex gap-2">
        <Link
          href="/matches?filter=upcoming"
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
            filter === "upcoming"
              ? "bg-navy-700 text-white"
              : "border border-ink-200 bg-surface text-ink-500 hover:bg-navy-50 hover:text-navy-700"
          }`}
        >
          À venir
        </Link>
        <Link
          href="/matches?filter=past"
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
            filter === "past"
              ? "bg-navy-700 text-white"
              : "border border-ink-200 bg-surface text-ink-500 hover:bg-navy-50 hover:text-navy-700"
          }`}
        >
          Passés
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-ink-100 bg-surface p-14 text-center">
          <p className="text-sm text-ink-500">
            {filter === "upcoming"
              ? "Aucun match à venir pour tes équipes."
              : "Aucun match passé pour tes équipes."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {matches.map((match) => {
            const isInTeamA = match.teamA.members.length > 0;
            const myTeam = isInTeamA ? match.teamA : match.teamB;
            const opponent = isInTeamA ? match.teamB : match.teamA;
            const hasScore = match.scoreA !== null && match.scoreB !== null;
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
                className="rounded-2xl border border-ink-100 bg-surface p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1">
                      {myTeam.tournament.name}
                    </p>
                    <div className="flex items-center gap-2 text-base font-bold text-navy-700">
                      <span>{myTeam.name}</span>
                      <span className="text-ink-300 font-normal text-sm">vs</span>
                      <span>{opponent.name}</span>
                    </div>
                  </div>

                  {hasScore && (
                    <div className="text-right">
                      <p className="text-xs text-ink-400 mb-0.5">Score final</p>
                      <p className="font-display text-3xl text-navy-700 tabular-nums">
                        {myScore}&nbsp;–&nbsp;{oppScore}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-ink-100 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-500">
                  <span>
                    <span className="font-medium text-ink-700">Date :</span>{" "}
                    {dateStr}
                  </span>
                  <span>
                    <span className="font-medium text-ink-700">Heure :</span>{" "}
                    {timeStr}
                  </span>
                  <span>
                    <span className="font-medium text-ink-700">Lieu :</span>{" "}
                    {match.location}
                  </span>
                </div>

                {!hasScore && filter === "upcoming" && (
                  <p className="mt-2 text-xs text-ink-400 italic">
                    Score non encore saisi
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
