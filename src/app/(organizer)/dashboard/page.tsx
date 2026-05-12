import { requireUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Tableau de bord</h1>
      <p className="mb-6 text-sm text-gray-500">Bienvenue, {user.fullName}</p>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Tournois</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">0</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Équipes inscrites</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">0</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Matchs joués</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">0</p>
        </div>
      </div>
    </div>
  );
}
