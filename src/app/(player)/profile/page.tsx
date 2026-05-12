import { requireUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Mon profil</h1>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Nom</p>
        <p className="mt-1 font-medium text-gray-900">{user.fullName}</p>
        <p className="mt-4 text-sm text-gray-500">Courriel</p>
        <p className="mt-1 font-medium text-gray-900">{user.email}</p>
        <p className="mt-4 text-sm text-gray-500">Rôle</p>
        <p className="mt-1 font-medium text-gray-900">{user.role}</p>
      </div>
    </div>
  );
}
