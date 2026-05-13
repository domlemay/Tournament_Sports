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

  const inputClass =
    "w-full rounded-lg border border-ink-200 bg-surface px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-100 transition-colors";
  const labelClass = "block text-sm font-medium text-ink-700 mb-1.5";

  return (
    <div className="py-4 max-w-lg">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-ink-500 hover:text-navy-700 transition-colors"
        >
          ← Tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-navy-700 mt-4">
          Nouveau tournoi
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Configure les informations de base de ton tournoi.
        </p>
      </div>

      <div className="rounded-2xl border border-ink-100 bg-surface shadow-sm p-8">
        <form action={createTournament} className="space-y-6">
          <div>
            <label htmlFor="name" className={labelClass}>
              Nom du tournoi
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Coupe de Montréal 2026"
              className={inputClass}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="sport" className={labelClass}>
              Sport
            </label>
            <input
              id="sport"
              name="sport"
              type="text"
              placeholder="Soccer, Basketball…"
              className={inputClass}
            />
            {errors.sport && (
              <p className="mt-1.5 text-xs text-red-500">{errors.sport}</p>
            )}
          </div>

          <div>
            <label htmlFor="city" className={labelClass}>
              Ville
            </label>
            <input
              id="city"
              name="city"
              type="text"
              placeholder="Montréal"
              className={inputClass}
            />
            {errors.city && (
              <p className="mt-1.5 text-xs text-red-500">{errors.city}</p>
            )}
          </div>

          <div>
            <label htmlFor="startDate" className={labelClass}>
              Date de début
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              className={inputClass}
            />
            {errors.startDate && (
              <p className="mt-1.5 text-xs text-red-500">{errors.startDate}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="entryFee" className={labelClass}>
                Frais d&apos;inscription (en $)
              </label>
              <input
                id="entryFee"
                name="entryFee"
                type="number"
                min={0}
                defaultValue={0}
                className={inputClass}
              />
              {errors.entryFee && (
                <p className="mt-1.5 text-xs text-red-500">{errors.entryFee}</p>
              )}
            </div>
            <div>
              <label htmlFor="currency" className={labelClass}>
                Devise
              </label>
              <select
                id="currency"
                name="currency"
                defaultValue="CAD"
                className={inputClass}
              >
                <option value="CAD">CAD</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
              {errors.currency && (
                <p className="mt-1.5 text-xs text-red-500">{errors.currency}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-navy-700 text-white text-sm font-semibold py-2.5 hover:bg-navy-800 transition-colors cursor-pointer"
          >
            Créer le tournoi
          </button>
        </form>
      </div>
    </div>
  );
}
