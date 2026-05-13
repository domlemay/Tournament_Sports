import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createTeam, updateTeam, deleteTeam } from "@/app/server/actions/teams";
import { deleteTournament } from "@/app/server/actions/tournaments";
import {
  createMatch,
  updateMatch,
  deleteMatch,
} from "@/app/server/actions/matches";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

async function getPageData(id: string, clerkId: string) {
  const organizer = await prisma.user.findUnique({ where: { clerkId } });
  if (!organizer) return null;

  const tournament = await prisma.tournament.findFirst({
    where: { id, organizerId: organizer.id },
    include: {
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

  if (!tournament) return null;

  const matches = await prisma.match.findMany({
    where: { teamA: { tournamentId: id } },
    include: {
      teamA: { select: { id: true, name: true } },
      teamB: { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
  });

  return { tournament, matches };
}

export default async function TournamentDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const sp = await searchParams;

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const data = await getPageData(id, userId);
  if (!data) redirect("/dashboard");

  const { tournament, matches } = data;

  const editTeamId = sp.edit ?? null;
  const teamErrors = {
    name: sp.e_name,
    maxCapacity: sp.e_maxCapacity,
    delete: sp.e_delete,
  };

  const editMatchId = sp.editMatch ?? null;
  const matchErrors = {
    teamA: sp.e_m_teamA,
    teamB: sp.e_m_teamB,
    date: sp.e_m_date,
    location: sp.e_m_location,
    updateDate: sp.e_um_date,
    updateLocation: sp.e_um_location,
  };

  const isSuccess =
    sp.success === "team" || sp.success === "1" || sp.success === "match";

  const deleteTournamentWithId = deleteTournament.bind(null, tournament.id);

  const inputClass =
    "w-full rounded-lg border border-ink-200 bg-surface px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-100 transition-colors";
  const inputSmClass =
    "w-full rounded-lg border border-ink-200 bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-100 transition-colors";
  const labelClass = "block text-sm font-medium text-ink-700 mb-1.5";
  const labelSmClass = "block text-xs font-medium text-ink-600 mb-1";

  return (
    <div className="py-4 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-ink-500 hover:text-navy-700 transition-colors"
        >
          ← Tableau de bord
        </Link>
        <form action={deleteTournamentWithId}>
          <button
            type="submit"
            className="text-xs text-red-500 hover:text-red-700 underline cursor-pointer"
          >
            Supprimer le tournoi
          </button>
        </form>
      </div>

      {/* Tournament info */}
      <div>
        <h1 className="text-2xl font-bold text-navy-700">{tournament.name}</h1>
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

      {isSuccess && (
        <div className="rounded-lg border border-success-100 bg-success-100 px-4 py-3 text-success-600 text-sm font-medium">
          Opération effectuée avec succès.
        </div>
      )}

      {teamErrors.delete && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm">
          {teamErrors.delete}
        </div>
      )}

      {/* ── Teams ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-navy-700 mb-4">
          Équipes ({tournament.teams.length})
        </h2>

        {tournament.teams.length === 0 ? (
          <div className="rounded-2xl border border-ink-100 bg-surface shadow-sm p-8 text-center text-sm text-ink-500">
            Aucune équipe pour ce tournoi.
          </div>
        ) : (
          <div className="space-y-3">
            {tournament.teams.map((team) => {
              const isEditing = editTeamId === team.id;
              const updateWithId = updateTeam.bind(null, team.id, tournament.id);
              const deleteWithId = deleteTeam.bind(null, team.id, tournament.id);

              return (
                <div
                  key={team.id}
                  className="rounded-2xl border border-ink-100 bg-surface shadow-sm"
                >
                  <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
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
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <Link
                          href={`/tournaments/${tournament.id}`}
                          className="rounded-md border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-navy-50 transition-colors"
                        >
                          Annuler
                        </Link>
                      ) : (
                        <Link
                          href={`/tournaments/${tournament.id}?edit=${team.id}`}
                          className="rounded-md border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-navy-50 hover:text-navy-700 transition-colors"
                        >
                          Modifier
                        </Link>
                      )}
                      <form action={deleteWithId}>
                        <button
                          type="submit"
                          disabled={team._count.members > 0}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="border-t border-ink-100 px-6 py-5">
                      <form action={updateWithId} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor={`edit-name-${team.id}`}
                              className={labelSmClass}
                            >
                              Nom
                            </label>
                            <input
                              id={`edit-name-${team.id}`}
                              name="name"
                              type="text"
                              defaultValue={team.name}
                              className={inputSmClass}
                            />
                            {teamErrors.name && (
                              <p className="mt-1 text-xs text-red-500">
                                {teamErrors.name}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor={`edit-cap-${team.id}`}
                              className={labelSmClass}
                            >
                              Capacité maximale
                            </label>
                            <input
                              id={`edit-cap-${team.id}`}
                              name="maxCapacity"
                              type="number"
                              min={team._count.members || 2}
                              max={50}
                              defaultValue={team.maxCapacity}
                              className={inputSmClass}
                            />
                            {teamErrors.maxCapacity && (
                              <p className="mt-1 text-xs text-red-500">
                                {teamErrors.maxCapacity}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="rounded-lg bg-navy-700 text-white text-sm font-semibold px-4 py-2 hover:bg-navy-800 transition-colors cursor-pointer"
                        >
                          Sauvegarder
                        </button>
                      </form>
                    </div>
                  )}

                  {team.members.length > 0 && (
                    <div className="border-t border-ink-100 px-6 py-4">
                      <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">
                        Membres
                      </p>
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
              );
            })}
          </div>
        )}
      </div>

      {/* Create team form */}
      <div className="rounded-2xl border border-ink-100 bg-surface shadow-sm p-8">
        <h2 className="text-base font-semibold text-navy-700 mb-6">
          Nouvelle équipe
        </h2>
        <form action={createTeam.bind(null, tournament.id)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="name" className={labelClass}>
                Nom de l&apos;équipe
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Les Aigles"
                className={inputClass}
              />
              {!editTeamId && teamErrors.name && (
                <p className="mt-1.5 text-xs text-red-500">{teamErrors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor="maxCapacity" className={labelClass}>
                Capacité maximale
              </label>
              <input
                id="maxCapacity"
                name="maxCapacity"
                type="number"
                min={2}
                max={50}
                defaultValue={15}
                className={inputClass}
              />
              {!editTeamId && teamErrors.maxCapacity && (
                <p className="mt-1.5 text-xs text-red-500">
                  {teamErrors.maxCapacity}
                </p>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-navy-700 text-white text-sm font-semibold px-6 py-2.5 hover:bg-navy-800 transition-colors cursor-pointer"
          >
            Créer l&apos;équipe
          </button>
        </form>
      </div>

      {/* ── Matches ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-navy-700 mb-4">
          Matchs ({matches.length})
        </h2>

        {matches.length === 0 ? (
          <div className="rounded-2xl border border-ink-100 bg-surface shadow-sm p-8 text-center text-sm text-ink-500">
            Aucun match pour ce tournoi.
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => {
              const isEditingMatch = editMatchId === match.id;
              const updateMatchWithId = updateMatch.bind(
                null,
                match.id,
                tournament.id
              );
              const deleteMatchWithId = deleteMatch.bind(
                null,
                match.id,
                tournament.id
              );
              const hasScore = match.scoreA !== null && match.scoreB !== null;

              return (
                <div
                  key={match.id}
                  className="rounded-2xl border border-ink-100 bg-surface shadow-sm"
                >
                  <div className="px-6 py-4 flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-0.5">
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
                      <p className="text-sm text-ink-500">
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
                    <div className="flex items-center gap-2 shrink-0">
                      {isEditingMatch ? (
                        <Link
                          href={`/tournaments/${tournament.id}`}
                          className="rounded-md border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-navy-50 transition-colors"
                        >
                          Annuler
                        </Link>
                      ) : (
                        <Link
                          href={`/tournaments/${tournament.id}?editMatch=${match.id}`}
                          className="rounded-md border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-navy-50 hover:text-navy-700 transition-colors"
                        >
                          Modifier
                        </Link>
                      )}
                      <form action={deleteMatchWithId}>
                        <button
                          type="submit"
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </div>

                  {isEditingMatch && (
                    <div className="border-t border-ink-100 px-6 py-5">
                      <form action={updateMatchWithId} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor={`edit-date-${match.id}`}
                              className={labelSmClass}
                            >
                              Date et heure
                            </label>
                            <input
                              id={`edit-date-${match.id}`}
                              name="date"
                              type="datetime-local"
                              defaultValue={match.date
                                .toISOString()
                                .slice(0, 16)}
                              className={inputSmClass}
                            />
                            {matchErrors.updateDate && (
                              <p className="mt-1 text-xs text-red-500">
                                {matchErrors.updateDate}
                              </p>
                            )}
                          </div>
                          <div>
                            <label
                              htmlFor={`edit-loc-${match.id}`}
                              className={labelSmClass}
                            >
                              Lieu
                            </label>
                            <input
                              id={`edit-loc-${match.id}`}
                              name="location"
                              type="text"
                              defaultValue={match.location}
                              className={inputSmClass}
                            />
                            {matchErrors.updateLocation && (
                              <p className="mt-1 text-xs text-red-500">
                                {matchErrors.updateLocation}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className={labelSmClass}>
                            Résultat{" "}
                            <span className="font-normal text-ink-400">
                              (optionnel)
                            </span>
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor={`score-a-${match.id}`}
                                className="block text-xs text-ink-500 mb-1"
                              >
                                {match.teamA.name}
                              </label>
                              <input
                                id={`score-a-${match.id}`}
                                name="scoreA"
                                type="number"
                                min={0}
                                defaultValue={match.scoreA ?? ""}
                                placeholder="—"
                                className={inputSmClass}
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`score-b-${match.id}`}
                                className="block text-xs text-ink-500 mb-1"
                              >
                                {match.teamB.name}
                              </label>
                              <input
                                id={`score-b-${match.id}`}
                                name="scoreB"
                                type="number"
                                min={0}
                                defaultValue={match.scoreB ?? ""}
                                placeholder="—"
                                className={inputSmClass}
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="rounded-lg bg-navy-700 text-white text-sm font-semibold px-4 py-2 hover:bg-navy-800 transition-colors cursor-pointer"
                        >
                          Sauvegarder
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create match form */}
      <div className="rounded-2xl border border-ink-100 bg-surface shadow-sm p-8">
        <h2 className="text-base font-semibold text-navy-700 mb-6">
          Nouveau match
        </h2>

        {tournament.teams.length < 2 ? (
          <p className="text-sm text-ink-500">
            Crée au moins deux équipes pour planifier un match.
          </p>
        ) : (
          <form
            action={createMatch.bind(null, tournament.id)}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="teamAId" className={labelClass}>
                  Équipe A
                </label>
                <select id="teamAId" name="teamAId" className={inputClass}>
                  {tournament.teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {matchErrors.teamA && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {matchErrors.teamA}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="teamBId" className={labelClass}>
                  Équipe B
                </label>
                <select id="teamBId" name="teamBId" className={inputClass}>
                  {tournament.teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {matchErrors.teamB && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {matchErrors.teamB}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="date" className={labelClass}>
                  Date et heure
                </label>
                <input
                  id="date"
                  name="date"
                  type="datetime-local"
                  className={inputClass}
                />
                {matchErrors.date && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {matchErrors.date}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="location" className={labelClass}>
                  Lieu
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="Stade Municipal, terrain 3"
                  className={inputClass}
                />
                {matchErrors.location && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {matchErrors.location}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-navy-700 text-white text-sm font-semibold px-6 py-2.5 hover:bg-navy-800 transition-colors cursor-pointer"
            >
              Créer le match
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
