import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <div className="py-4 flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full rounded-2xl border border-ink-100 bg-surface shadow-sm p-10 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-100">
          <span className="text-2xl text-success-600 font-bold">✓</span>
        </div>
        <h1 className="text-xl font-bold text-navy-700">Paiement confirmé</h1>
        <p className="text-sm text-ink-500">
          Ton paiement a été reçu. Ta demande est maintenant en attente
          d&apos;approbation par l&apos;organisateur.
        </p>
        <Link
          href="/my-requests"
          className="inline-block mt-2 rounded-lg bg-navy-700 text-white text-sm font-semibold px-6 py-2.5 hover:bg-navy-800 transition-colors"
        >
          Voir mes demandes
        </Link>
      </div>
    </div>
  );
}
