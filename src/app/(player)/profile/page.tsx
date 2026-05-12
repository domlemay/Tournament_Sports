import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  fullName: z.string().min(2, "Le nom complet doit comporter au moins 2 caractères"),
  city: z.string().min(2, "La ville doit comporter au moins 2 caractères"),
  favoriteSport: z.string().min(2, "Veuillez préciser le sport principal"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"], {
    error: "Veuillez choisir un niveau",
  }),
  position: z.string().optional(),
});

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ProfilePage({ searchParams }: PageProps) {
  const params = await searchParams;

  const errors = {
    fullName: params.e_fullName,
    city: params.e_city,
    favoriteSport: params.e_favoriteSport,
    level: params.e_level,
  };
  const isSuccess = params.success === "1";

  async function updateProfile(formData: FormData) {
    "use server";

    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const raw = {
      fullName: formData.get("fullName") as string,
      city: formData.get("city") as string,
      favoriteSport: formData.get("favoriteSport") as string,
      level: formData.get("level") as string,
      position: (formData.get("position") as string) || undefined,
    };

    const result = profileSchema.safeParse(raw);

    if (!result.success) {
      const fieldErrors = z.flattenError(result.error).fieldErrors;
      const sp = new URLSearchParams();
      for (const [key, msgs] of Object.entries(fieldErrors)) {
        if (msgs?.[0]) sp.set(`e_${key}`, msgs[0]);
      }
      redirect(`/profile?${sp.toString()}`);
    }

    const { fullName, city, favoriteSport, level, position } = result.data;

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) redirect("/sign-in");

    await prisma.user.update({
      where: { id: user.id },
      data: { fullName },
    });

    await prisma.playerProfile.upsert({
      where: { userId: user.id },
      update: { city, favoriteSport, level, position: position ?? null },
      create: { userId: user.id, city, favoriteSport, level, position: position ?? null },
    });

    redirect("/profile?success=1");
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">
          Mon profil
        </h1>

        {isSuccess && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 px-4 py-3 text-green-700 dark:text-green-300 text-sm">
            Profil mis à jour avec succès.
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
          <form action={updateProfile} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Nom complet
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Jean Dupont"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              {errors.fullName && <p className="mt-1.5 text-xs text-red-500">{errors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Ville
              </label>
              <input
                id="city"
                name="city"
                type="text"
                placeholder="Montréal"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              {errors.city && <p className="mt-1.5 text-xs text-red-500">{errors.city}</p>}
            </div>

            <div>
              <label htmlFor="favoriteSport" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Sport principal
              </label>
              <input
                id="favoriteSport"
                name="favoriteSport"
                type="text"
                placeholder="Soccer, Basketball…"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              {errors.favoriteSport && <p className="mt-1.5 text-xs text-red-500">{errors.favoriteSport}</p>}
            </div>

            <div>
              <label htmlFor="level" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Niveau
              </label>
              <select
                id="level"
                name="level"
                defaultValue=""
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              >
                <option value="" disabled>-- Choisir un niveau --</option>
                <option value="BEGINNER">Débutant</option>
                <option value="INTERMEDIATE">Intermédiaire</option>
                <option value="ADVANCED">Avancé</option>
              </select>
              {errors.level && <p className="mt-1.5 text-xs text-red-500">{errors.level}</p>}
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Poste préféré{" "}
                <span className="font-normal text-zinc-400">(optionnel)</span>
              </label>
              <input
                id="position"
                name="position"
                type="text"
                placeholder="Attaquant, Défenseur…"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold py-2.5 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors cursor-pointer"
            >
              Sauvegarder
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
