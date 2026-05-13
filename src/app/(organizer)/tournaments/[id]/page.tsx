import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createTeam, updateTeam, deleteTeam } from "@/app/server/actions/teams";
import { deleteTournament } from "@/app/server/actions/tournaments";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

async function getTournament(id: string, clerkId: string) {
  const organizer = await prisma.user.findUnique({ where: { clerkId } });
  if (!organizer) return null;

  return prisma.tournament.findFirst({
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
}

export default async function TournamentDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const sp = await searchParams;

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const tournament = await getTournament(id, userId);
  if (!tournament) redirect("/dashboard");

  const editTeamId = sp.edit ?? null;
  const isSuccess = sp.success === "team" || sp.success === "1";
  const errors = {
    name: sp.e_name,
    maxCapacity: sp.e_maxCapacity,
    delete: sp.e_delete,
  };

  const deleteTournamentWithId = deleteTournament.bind(null, tournament.id);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            ← Tableau de bord
          </Link>
          <form action={deleteTournamentWithId}>
            <button
              type="submit"
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 underline"
            >
              Supprimer le tournoi
            </button>
          </form>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {tournament.name}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
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
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 px-4 py-3 text-green-700 dark:text-green-300 text-sm">
            Opération effectuée avec succès.
          </div>
        )}

        {errors.delete && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 px-4 py-3 text-red-700 dark:text-red-300 text-sm">
            {errors.delete}
          </div>
        )}

        {/* Teams list */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Équipes ({tournament.teams.length})
          </h2>

          {tournament.teams.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Aucune équipe pour ce tournoi.
            </div>
          ) : (
            <div className="space-y-3">
              {tournament.teams.map((team) => {
                const isEditing = editTeamId === team.id;
                const updateWithId = updateTeam.bind(
                  null,
                  team.id,
                  tournament.id
                );
                const deleteWithId = deleteTeam.bind(
                  null,
                  team.id,
                  tournament.id
                );

                return (
                  <div
                    key={team.id}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
                  >
                    <div className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {team.name}
                        </span>
                        <span className="ml-3 text-sm text-zinc-500 dark:text-zinc-400">
                          {team._count.members}/{team.maxCapacity} joueurs
                        </span>
                        {team._count.joinRequests > 0 && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                            {team._count.joinRequests} en attente
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <Link
                            href={`/tournaments/${tournament.id}`}
                            className="rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            Annuler
                          </Link>
                        ) : (
                          <Link
                            href={`/tournaments/${tournament.id}?edit=${team.id}`}
                            className="rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            Modifier
                          </Link>
                        )}
                        <form action={deleteWithId}>
                          <button
                            type="submit"
                            disabled={team._count.members > 0}
                            className="rounded-md border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Supprimer
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Inline edit form */}
                    {isEditing && (
                      <div className="border-t border-zinc-100 dark:border-zinc-800 px-6 py-5">
                        <form action={updateWithId} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor={`edit-name-${team.id}`}
                                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
                              >
                                Nom
                              </label>
                              <input
                                id={`edit-name-${team.id}`}
                                name="name"
                                type="text"
                                defaultValue={team.name}
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                              />
                              {errors.name && (
                                <p className="mt-1 text-xs text-red-500">
                                  {errors.name}
                                </p>
                              )}
                            </div>
                            <div>
                              <label
                                htmlFor={`edit-cap-${team.id}`}
                                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
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
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                              />
                              {errors.maxCapacity && (
                                <p className="mt-1 text-xs text-red-500">
                                  {errors.maxCapacity}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold px-4 py-2 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors cursor-pointer"
                          >
                            Sauvegarder
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Members list */}
                    {team.members.length > 0 && (
                      <div className="border-t border-zinc-100 dark:border-zinc-800 px-6 py-4">
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                          Membres
                        </p>
                        <ul className="flex flex-wrap gap-2">
                          {team.members.map((m) => (
                            <li
                              key={m.id}
                              className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300"
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
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
            Nouvelle équipe
          </h2>
          <form
            action={createTeam.bind(null, tournament.id)}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                >
                  Nom de l&apos;équipe
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Les Aigles"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
                {!editTeamId && errors.name && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="maxCapacity"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                >
                  Capacité maximale
                </label>
                <input
                  id="maxCapacity"
                  name="maxCapacity"
                  type="number"
                  min={2}
                  max={50}
                  defaultValue={15}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
                {!editTeamId && errors.maxCapacity && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.maxCapacity}
                  </p>
                )}
              </div>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold px-6 py-2.5 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors cursor-pointer"
            >
              Créer l&apos;équipe
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
