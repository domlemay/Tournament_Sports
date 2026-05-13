import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cancelJoinRequest, retryPayment } from "@/app/server/actions/join-requests";

const statusLabel: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  REJECTED: "Refusée",
};

const statusClass: Record<string, string> = {
  PENDING: "bg-warning-100 text-warning-600",
  ACCEPTED: "bg-success-100 text-success-600",
  REJECTED: "bg-red-100 text-red-600",
};

export default async function MyRequestsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect("/sign-in");

  const requests = await prisma.joinRequest.findMany({
    where: { playerId: user.id },
    include: {
      team: {
        include: {
          tournament: { select: { name: true, sport: true, city: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="py-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-700">Mes demandes</h1>
        <p className="mt-1 text-sm text-ink-500">
          Suis l'état de tes demandes d'adhésion aux équipes.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-ink-100 bg-surface p-14 text-center">
          <p className="text-sm text-ink-500">
            Tu n&apos;as pas encore fait de demande.
          </p>
          <Link
            href="/teams"
            className="mt-3 inline-block text-sm font-medium text-navy-700 underline hover:text-navy-800"
          >
            Chercher une équipe
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const canCancel =
              req.status === "PENDING" && req.paymentStatus !== "PAID";
            const canRetryPayment =
              req.status === "PENDING" && req.paymentStatus === "PENDING";
            return (
              <div
                key={req.id}
                className="rounded-2xl border border-ink-100 bg-surface p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-semibold text-navy-700 truncate">
                      {req.team.name}
                    </p>
                    <p className="text-sm text-ink-500">
                      {req.team.tournament.sport} · {req.team.tournament.city}
                    </p>
                    <p className="text-xs text-ink-400">
                      {req.team.tournament.name} ·{" "}
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
                    {req.paymentStatus === "PENDING" && (
                      <p className="text-xs font-medium text-warning-600 pt-1">
                        Paiement en attente
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusClass[req.status]}`}
                    >
                      {statusLabel[req.status]}
                    </span>
                    {canRetryPayment && (
                      <form action={retryPayment.bind(null, req.id)}>
                        <button
                          type="submit"
                          className="rounded-lg bg-navy-700 text-white text-xs font-semibold px-3 py-1.5 hover:bg-navy-800 transition-colors cursor-pointer"
                        >
                          Payer maintenant
                        </button>
                      </form>
                    )}
                    {canCancel && (
                      <form action={cancelJoinRequest.bind(null, req.id)}>
                        <button
                          type="submit"
                          className="text-xs text-red-500 hover:text-red-700 underline cursor-pointer"
                        >
                          Annuler
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
