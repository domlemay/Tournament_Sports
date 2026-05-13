import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  acceptJoinRequest,
  rejectJoinRequest,
} from "@/app/server/actions/join-requests";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

const levelLabel: Record<string, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

export default async function RequestsPage({ searchParams }: PageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const organizer = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!organizer || organizer.role !== "ORGANIZER") redirect("/dashboard");

  const sp = await searchParams;
  const teamFilter = sp.team ?? "";
  const error = sp.e;

  const teams = await prisma.team.findMany({
    where: { tournament: { organizerId: organizer.id } },
    select: { id: true, name: true, tournament: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const requests = await prisma.joinRequest.findMany({
    where: {
      status: "PENDING",
      paymentStatus: { in: ["NOT_REQUIRED", "PAID"] },
      team: {
        ...(teamFilter ? { id: teamFilter } : {}),
        tournament: { organizerId: organizer.id },
      },
    },
    include: {
      player: {
        include: {
          playerProfile: {
            select: { city: true, favoriteSport: true, level: true },
          },
        },
      },
      team: {
        include: { tournament: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Demandes d&apos;inscription
          </h1>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {requests.length} en attente
          </span>
        </div>

        {teams.length > 0 && (
          <form method="get" className="flex gap-3 items-center">
            <select
              name="team"
              defaultValue={teamFilter}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              <option value="">Toutes les équipes</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.tournament.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold px-4 py-2.5 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors cursor-pointer"
            >
              Filtrer
            </button>
          </form>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 px-4 py-3 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {requests.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Aucune demande en attente.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {req.player.fullName}
                      </p>
                      {req.player.playerProfile && (
                        <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                          {levelLabel[req.player.playerProfile.level]}
                        </span>
                      )}
                    </div>
                    {req.player.playerProfile && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {req.player.playerProfile.city} ·{" "}
                        {req.player.playerProfile.favoriteSport}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      Équipe : {req.team.name} — {req.team.tournament.name} ·{" "}
                      {req.createdAt.toLocaleDateString("fr-CA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    {req.message && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 italic pt-1">
                        &ldquo;{req.message}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={acceptJoinRequest.bind(null, req.id)}>
                      <button
                        type="submit"
                        className="rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 transition-colors cursor-pointer"
                      >
                        Accepter
                      </button>
                    </form>
                    <form action={rejectJoinRequest.bind(null, req.id)}>
                      <button
                        type="submit"
                        className="rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-semibold px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                      >
                        Refuser
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
