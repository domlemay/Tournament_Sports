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

  const selectClass =
    "rounded-lg border border-ink-200 bg-surface px-3.5 py-2.5 text-sm text-ink-900 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-100 transition-colors";

  return (
    <div className="py-4 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-700">
            Demandes d&apos;inscription
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Accepte ou refuse les joueurs qui souhaitent rejoindre tes équipes.
          </p>
        </div>
        <span className="rounded-full bg-navy-50 px-3 py-1 text-sm font-semibold text-navy-700 shrink-0">
          {requests.length} en attente
        </span>
      </div>

      {/* Team filter */}
      {teams.length > 0 && (
        <form method="get" className="flex gap-3 items-center flex-wrap">
          <select name="team" defaultValue={teamFilter} className={selectClass}>
            <option value="">Toutes les équipes</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.tournament.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-navy-700 text-white text-sm font-semibold px-4 py-2.5 hover:bg-navy-800 transition-colors cursor-pointer"
          >
            Filtrer
          </button>
        </form>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-ink-100 bg-surface shadow-sm p-14 text-center">
          <p className="text-sm text-ink-500">Aucune demande en attente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl border border-ink-100 bg-surface shadow-sm p-6"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-navy-700">
                      {req.player.fullName}
                    </p>
                    {req.player.playerProfile && (
                      <span className="text-xs bg-navy-50 text-navy-700 px-2.5 py-0.5 rounded-full font-medium">
                        {levelLabel[req.player.playerProfile.level]}
                      </span>
                    )}
                  </div>
                  {req.player.playerProfile && (
                    <p className="text-sm text-ink-500">
                      {req.player.playerProfile.city} ·{" "}
                      {req.player.playerProfile.favoriteSport}
                    </p>
                  )}
                  <p className="text-xs text-ink-400">
                    Équipe : {req.team.name} — {req.team.tournament.name} ·{" "}
                    {req.createdAt.toLocaleDateString("fr-CA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  {req.message && (
                    <p className="text-sm text-ink-600 italic pt-1">
                      &ldquo;{req.message}&rdquo;
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={acceptJoinRequest.bind(null, req.id)}>
                    <button
                      type="submit"
                      className="rounded-lg bg-success-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 transition-colors cursor-pointer"
                    >
                      Accepter
                    </button>
                  </form>
                  <form action={rejectJoinRequest.bind(null, req.id)}>
                    <button
                      type="submit"
                      className="rounded-lg border border-ink-200 bg-surface text-sm font-semibold px-4 py-2 text-ink-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
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
  );
}
