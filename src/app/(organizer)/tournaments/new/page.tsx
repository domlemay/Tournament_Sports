import { createTournament } from "@/app/server/actions/tournaments";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function NewTournamentPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const errors = {
    name: sp.e_name,
    sport: sp.e_sport,
    city: sp.e_city,
    startDate: sp.e_startDate,
    entryFee: sp.e_entryFee,
    currency: sp.e_currency,
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            ← Tableau de bord
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-4">
            Nouveau tournoi
          </h1>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
          <form action={createTournament} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Nom du tournoi
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Coupe de Montréal 2025"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="sport"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Sport
              </label>
              <input
                id="sport"
                name="sport"
                type="text"
                placeholder="Soccer, Basketball…"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              {errors.sport && (
                <p className="mt-1.5 text-xs text-red-500">{errors.sport}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Ville
              </label>
              <input
                id="city"
                name="city"
                type="text"
                placeholder="Montréal"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              {errors.city && (
                <p className="mt-1.5 text-xs text-red-500">{errors.city}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Date de début
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              {errors.startDate && (
                <p className="mt-1.5 text-xs text-red-500">{errors.startDate}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="entryFee"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                >
                  Frais d&apos;inscription
                </label>
                <input
                  id="entryFee"
                  name="entryFee"
                  type="number"
                  min={0}
                  defaultValue={0}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
                {errors.entryFee && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.entryFee}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="currency"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                >
                  Devise
                </label>
                <select
                  id="currency"
                  name="currency"
                  defaultValue="CAD"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  <option value="CAD">CAD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold py-2.5 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors cursor-pointer"
            >
              Créer le tournoi
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
