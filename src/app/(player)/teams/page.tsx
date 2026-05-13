import Link from "next/link";
import { prisma } from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

async function searchTeams(city?: string, sport?: string) {
  return prisma.team.findMany({
    where: {
      tournament: {
        ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
        ...(sport ? { sport: { contains: sport, mode: "insensitive" } } : {}),
      },
    },
    include: {
      tournament: {
        select: { name: true, sport: true, city: true, startDate: true },
      },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function TeamsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const city = sp.city ?? "";
  const sport = sp.sport ?? "";
  const onlyAvailable = sp.available === "1";

  let teams = await searchTeams(city || undefined, sport || undefined);
  if (onlyAvailable) {
    teams = teams.filter((t) => t._count.members < t.maxCapacity);
  }

  const inputClass =
    "rounded-lg border border-ink-200 bg-surface px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-100 transition-colors";

  return (
    <div className="py-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-700">Équipes</h1>
        <p className="mt-1 text-sm text-ink-500">
          Trouve une équipe qui te correspond et envoie une demande d'adhésion.
        </p>
      </div>

      {/* Filtres */}
      <form
        method="get"
        className="rounded-2xl border border-ink-100 bg-surface p-5 shadow-sm flex flex-col sm:flex-row gap-3"
      >
        <input
          name="city"
          type="text"
          placeholder="Ville"
          defaultValue={city}
          className={`${inputClass} flex-1`}
        />
        <input
          name="sport"
          type="text"
          placeholder="Sport"
          defaultValue={sport}
          className={`${inputClass} flex-1`}
        />
        <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer px-1 whitespace-nowrap">
          <input
            type="checkbox"
            name="available"
            value="1"
            defaultChecked={onlyAvailable}
            className="rounded border-ink-200 accent-navy-700"
          />
          Places disponibles
        </label>
        <button
          type="submit"
          className="rounded-lg bg-navy-700 text-white text-sm font-semibold px-5 py-2.5 hover:bg-navy-800 transition-colors cursor-pointer whitespace-nowrap"
        >
          Rechercher
        </button>
      </form>

      {/* Résultats */}
      {teams.length === 0 ? (
        <div className="rounded-2xl border border-ink-100 bg-surface p-14 text-center">
          <p className="text-sm text-ink-500">Aucune équipe trouvée.</p>
          <p className="mt-1 text-xs text-ink-400">
            Modifie tes filtres ou reviens plus tard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => {
            const spots = team.maxCapacity - team._count.members;
            const isFull = spots <= 0;
            return (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                className="group rounded-2xl border border-ink-100 bg-surface p-6 shadow-sm hover:border-navy-200 hover:shadow-md transition-all block"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="font-semibold text-navy-700 group-hover:text-navy-800">
                    {team.name}
                  </h2>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                      isFull
                        ? "bg-red-100 text-red-600"
                        : "bg-success-100 text-success-600"
                    }`}
                  >
                    {isFull ? "Complet" : `${spots} place${spots > 1 ? "s" : ""}`}
                  </span>
                </div>
                <p className="text-sm font-medium text-ink-700">
                  {team.tournament.sport}
                </p>
                <p className="text-sm text-ink-500">{team.tournament.city}</p>
                <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between">
                  <p className="text-xs text-ink-400">{team.tournament.name}</p>
                  <p className="text-xs font-mono tabular-nums text-ink-500">
                    {team._count.members}/{team.maxCapacity}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
