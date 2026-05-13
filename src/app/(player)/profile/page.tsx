import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
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
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { playerProfile: true },
  });

  const params = await searchParams;

  const errors = {
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

    const { city, favoriteSport, level, position } = result.data;

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) redirect("/sign-in");

    await prisma.playerProfile.upsert({
      where: { userId: user.id },
      update: { city, favoriteSport, level, position: position ?? null },
      create: { userId: user.id, city, favoriteSport, level, position: position ?? null },
    });

    redirect("/profile?success=1");
  }

  async function becomeOrganizer() {
    "use server";
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user || user.role !== "PLAYER") return;
    await prisma.user.update({ where: { id: user.id }, data: { role: "ORGANIZER" } });
    redirect("/dashboard");
  }

  const inputClass =
    "w-full rounded-lg border border-ink-200 bg-surface px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-100 transition-colors";
  const labelClass = "block text-sm font-medium text-ink-700 mb-1.5";

  return (
    <div className="py-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-700">Mon profil</h1>
        <p className="mt-1 text-sm text-ink-500">
          Renseigne tes informations pour que les organisateurs puissent te trouver.
        </p>
      </div>

      {isSuccess && (
        <div className="mb-6 rounded-lg border border-success-100 bg-success-100 px-4 py-3 text-sm font-medium text-success-600">
          Profil mis à jour avec succès.
        </div>
      )}

      <div className="max-w-lg rounded-2xl border border-ink-100 bg-surface p-8 shadow-sm">
        <form action={updateProfile} className="space-y-5">
          <div>
            <p className={labelClass}>Nom complet</p>
            <p className="rounded-lg border border-ink-100 bg-paper px-3.5 py-2.5 text-sm text-ink-700">
              {dbUser?.fullName || "—"}
            </p>
            <p className="mt-1 text-xs text-ink-400">
              Synchronisé depuis ton compte Clerk
            </p>
          </div>

          <div>
            <label htmlFor="city" className={labelClass}>Ville</label>
            <input
              id="city"
              name="city"
              type="text"
              placeholder="Montréal"
              defaultValue={dbUser?.playerProfile?.city ?? ""}
              className={inputClass}
            />
            {errors.city && (
              <p className="mt-1.5 text-xs text-red-500">{errors.city}</p>
            )}
          </div>

          <div>
            <label htmlFor="favoriteSport" className={labelClass}>Sport principal</label>
            <input
              id="favoriteSport"
              name="favoriteSport"
              type="text"
              placeholder="Soccer, Basketball…"
              defaultValue={dbUser?.playerProfile?.favoriteSport ?? ""}
              className={inputClass}
            />
            {errors.favoriteSport && (
              <p className="mt-1.5 text-xs text-red-500">{errors.favoriteSport}</p>
            )}
          </div>

          <div>
            <label htmlFor="level" className={labelClass}>Niveau</label>
            <select
              id="level"
              name="level"
              defaultValue={dbUser?.playerProfile?.level ?? ""}
              className={inputClass}
            >
              <option value="" disabled>-- Choisir un niveau --</option>
              <option value="BEGINNER">Débutant</option>
              <option value="INTERMEDIATE">Intermédiaire</option>
              <option value="ADVANCED">Avancé</option>
            </select>
            {errors.level && (
              <p className="mt-1.5 text-xs text-red-500">{errors.level}</p>
            )}
          </div>

          <div>
            <label htmlFor="position" className={labelClass}>
              Poste préféré{" "}
              <span className="font-normal text-ink-400">(optionnel)</span>
            </label>
            <input
              id="position"
              name="position"
              type="text"
              placeholder="Attaquant, Défenseur…"
              defaultValue={dbUser?.playerProfile?.position ?? ""}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-navy-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 transition-colors cursor-pointer"
          >
            Sauvegarder
          </button>
        </form>
      </div>

      {dbUser?.role === "PLAYER" && (
        <div className="mt-6 max-w-lg rounded-2xl border border-ink-100 bg-surface p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-navy-700 mb-1">Accès organisateur</h2>
          <p className="text-xs text-ink-500 mb-4">
            Tu veux créer et gérer des tournois ? Active l&apos;accès organisateur sur ce compte.
          </p>
          <form action={becomeOrganizer}>
            <button
              type="submit"
              className="rounded-lg border border-navy-200 bg-navy-50 px-4 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-100 transition-colors cursor-pointer"
            >
              Devenir organisateur →
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
