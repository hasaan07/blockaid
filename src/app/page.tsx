import Link from "next/link";

export default function Home() {
  return (
    <main className="from-brand-50 flex min-h-screen flex-col items-center justify-center bg-gradient-to-br to-white p-8">
      <div className="max-w-3xl text-center">
        <h1 className="text-brand-700 mb-4 text-5xl font-bold">BlockAid</h1>
        <p className="mb-2 text-xl text-gray-700">Blockchain Based Fundraising Platform</p>
        <p className="mb-8 text-sm text-gray-500">
          BSCS Final Year Project • University of Lahore • Fall 2025
        </p>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">🚧 Under Construction</h2>
          <p className="mb-4 text-gray-600">
            Phase 1 of 10 complete. Project skeleton is in place.
          </p>
          <p className="text-sm text-gray-500">
            Coming next: smart contracts (Phase 2) and authentication (Phase 3).
          </p>
        </div>

        <div className="mt-8 flex justify-center gap-4 text-sm">
          <Link
            href="https://github.com/hasaan07/blockaid"
            className="text-brand-600 hover:underline"
          >
            View on GitHub →
          </Link>
        </div>
      </div>
    </main>
  );
}
