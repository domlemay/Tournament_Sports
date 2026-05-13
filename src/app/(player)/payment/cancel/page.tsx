import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-10 text-center space-y-4">
        <div className="text-4xl text-zinc-400">✕</div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Paiement annulé
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Le paiement a été annulé. Votre demande reste en attente de paiement
          — vous pouvez la consulter dans vos demandes ou réessayer.
        </p>
        <Link
          href="/teams"
          className="inline-block mt-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold px-6 py-2.5 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
        >
          Retour aux équipes
        </Link>
      </div>
    </main>
  );
}
