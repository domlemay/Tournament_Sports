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

  const inputClass =
    "w-full rounded-lg border border-ink-200 bg-surface px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-100 transition-colors";

  return (
    <div className="py-4 max-w-2xl space-y-6">
      <Link
        href="/teams"
        className="text-sm font-medium text-ink-500 hover:text-navy-700 transition-colors"
      >
        ← Toutes les équipes
      </Link>

      <div className="rounded-2xl border border-ink-100 bg-surface shadow-sm p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-700">{team.name}</h1>
            <p className="text-sm text-ink-500 mt-1">
              {team.tournament.sport} · {team.tournament.city}
            </p>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${
              spots > 0
                ? "bg-success-100 text-success-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            {spots > 0
              ? `${spots} place${spots > 1 ? "s" : ""}`
              : "Complet"}
          </span>
        </div>

        {/* Tournament info */}
        <div className="border-t border-ink-100 pt-5 space-y-2">
          <p className="text-sm text-ink-600">
            <span className="font-medium text-ink-700">Tournoi :</span>{" "}
            {team.tournament.name}
          </p>
          <p className="text-sm text-ink-600">
            <span className="font-medium text-ink-700">Date de début :</span>{" "}
            {team.tournament.startDate.toLocaleDateString("fr-CA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-sm text-ink-600">
            <span className="font-medium text-ink-700">
              Frais d&apos;inscription :
            </span>{" "}
            {team.tournament.entryFee === 0
              ? "Gratuit"
              : `${team.tournament.entryFee} ${team.tournament.currency}`}
          </p>
          <p className="text-sm text-ink-600">
            <span className="font-medium text-ink-700">Joueurs :</span>{" "}
            {team._count.members}/{team.maxCapacity}
          </p>
        </div>

        {/* Members */}
        <div className="border-t border-ink-100 pt-5">
          <p className="text-sm font-medium text-ink-700 mb-3">
            Membres ({team._count.members})
          </p>
          {team.members.length === 0 ? (
            <p className="text-sm text-ink-400">
              Aucun membre pour l&apos;instant.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {team.members.map((m) => (
                <li
                  key={m.id}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    m.id === currentUser.id
                      ? "bg-navy-700 text-white"
                      : "bg-navy-50 text-navy-700"
                  }`}
                >
                  {m.fullName}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Join action */}
        <div className="border-t border-ink-100 pt-5 space-y-3">
          {isSuccess && (
            <div className="rounded-lg border border-success-100 bg-success-100 px-4 py-3 text-success-600 text-sm font-medium">
              Demande de participation envoyée. En attente d&apos;approbation.
            </div>
          )}

          {joinError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm">
              {joinError}
            </div>
          )}

          {isMember && (
            <p className="text-sm text-center text-ink-500 py-2">
              Tu fais partie de cette équipe.
            </p>
          )}

          {existingRequest && !isMember && (
            <p className="text-sm text-center text-ink-500 py-2">
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
            <p className="text-sm text-center text-ink-500 py-2">
              Cette équipe est complète.
            </p>
          )}

          {!isMember && !existingRequest && spots > 0 && !isSuccess && (
            <form action={joinAction} className="space-y-4">
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-ink-700 mb-1.5"
                >
                  Message{" "}
                  <span className="font-normal text-ink-400">(optionnel)</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  placeholder="Présente-toi brièvement…"
                  className={`${inputClass} resize-none`}
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-navy-700 text-white text-sm font-semibold py-2.5 hover:bg-navy-800 transition-colors cursor-pointer"
              >
                {team.tournament.entryFee > 0
                  ? `Rejoindre · ${team.tournament.entryFee} ${team.tournament.currency}`
                  : "Rejoindre l'équipe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
