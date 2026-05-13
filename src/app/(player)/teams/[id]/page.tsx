import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createJoinRequest } from "@/app/server/actions/join-requests";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function TeamDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const sp = await searchParams;

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!currentUser) redirect("/sign-in");

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      tournament: {
        select: {
          name: true,
          sport: true,
          city: true,
          startDate: true,
          entryFee: true,
          currency: true,
        },
      },
      members: { select: { id: true, fullName: true } },
      _count: { select: { members: true } },
    },
  });
  if (!team) redirect("/teams");

  const existingRequest = await prisma.joinRequest.findUnique({
    where: { playerId_teamId: { playerId: currentUser.id, teamId: id } },
  });

  const isMember = team.members.some((m) => m.id === currentUser.id);
  const spots = team.maxCapacity - team._count.members;
  const isSuccess = sp.success === "join";
  const joinError = sp.e_join;

  const joinAction = createJoinRequest.bind(null, id);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/teams"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ← Toutes les équipes
        </Link>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {team.name}
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {team.tournament.sport} · {team.tournament.city}
              </p>
            </div>
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full ${
                spots > 0
                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
              }`}
            >
              {team._count.members}/{team.maxCapacity} joueurs
            </span>
          </div>

          {/* Tournament info */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5 space-y-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Tournoi :
              </span>{" "}
              {team.tournament.name}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Date :
              </span>{" "}
              {team.tournament.startDate.toLocaleDateString("fr-CA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Frais d&apos;entrée :
              </span>{" "}
              {team.tournament.entryFee === 0
                ? "Gratuit"
                : `${team.tournament.entryFee} ${team.tournament.currency}`}
            </p>
          </div>

          {/* Members */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              Membres ({team._count.members})
            </p>
            {team.members.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                Aucun membre pour l&apos;instant.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {team.members.map((m) => (
                  <li
                    key={m.id}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      m.id === currentUser.id
                        ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {m.fullName}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Join action */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
            {isSuccess && (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 px-4 py-3 text-green-700 dark:text-green-300 text-sm">
                Demande de participation envoyée. En attente d&apos;approbation.
              </div>
            )}

            {joinError && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 px-4 py-3 text-red-700 dark:text-red-300 text-sm">
                {joinError}
              </div>
            )}

            {isMember && (
              <p className="text-sm text-center text-zinc-500 dark:text-zinc-400">
                Vous êtes membre de cette équipe.
              </p>
            )}

            {existingRequest && !isMember && (
              <p className="text-sm text-center text-zinc-500 dark:text-zinc-400">
                Demande{" "}
                {existingRequest.status === "PENDING"
                  ? "en attente d'approbation"
                  : existingRequest.status === "ACCEPTED"
                  ? "acceptée"
                  : "refusée"}
                .
              </p>
            )}

            {!isMember && !existingRequest && spots === 0 && (
              <p className="text-sm text-center text-zinc-500 dark:text-zinc-400">
                Cette équipe est complète.
              </p>
            )}

            {!isMember && !existingRequest && spots > 0 && !isSuccess && (
              <form action={joinAction} className="space-y-3">
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                  >
                    Message (optionnel)
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    placeholder="Présentez-vous brièvement…"
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold py-2.5 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors cursor-pointer"
                >
                  {team.tournament.entryFee > 0
                    ? `Rejoindre — ${team.tournament.entryFee} ${team.tournament.currency}`
                    : "Rejoindre l'équipe"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
