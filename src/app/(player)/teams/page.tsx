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

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Équipes
        </h1>

        {/* Search form */}
        <form
          method="get"
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-5 flex flex-col sm:flex-row gap-3"
        >
          <input
            name="city"
            type="text"
            placeholder="Ville"
            defaultValue={city}
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
          <input
            name="sport"
            type="text"
            placeholder="Sport"
            defaultValue={sport}
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer px-1">
            <input
              type="checkbox"
              name="available"
              value="1"
              defaultChecked={onlyAvailable}
              className="rounded border-zinc-300 dark:border-zinc-700"
            />
            Places disponibles
          </label>
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold px-5 py-2.5 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            Rechercher
          </button>
        </form>

        {/* Results */}
        {teams.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Aucune équipe trouvée.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teams.map((team) => {
              const spots = team.maxCapacity - team._count.members;
              return (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors block"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {team.name}
                    </h2>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        spots > 0
                          ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                          : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {spots > 0 ? `${spots} place${spots > 1 ? "s" : ""}` : "Complet"}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {team.tournament.sport}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {team.tournament.city}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                    {team.tournament.name} · {team._count.members}/
                    {team.maxCapacity} joueurs
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
