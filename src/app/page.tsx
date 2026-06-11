import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-paper-edge">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <p className="text-sm font-semibold uppercase tracking-widest text-verdigris">
            Transparent fundraising
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[1.1] text-ink sm:text-6xl">
            Give with proof,
            <br />
            not promises.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-soft">
            Every donation on BlockAid is held in an escrow smart contract and recorded on the
            Polygon blockchain. Funds release to creators only when goals are met — otherwise
            backers get refunded.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/campaigns"
              className="rounded-md bg-verdigris px-6 py-3 font-semibold text-paper transition hover:bg-verdigris-dark"
            >
              Browse campaigns
            </Link>
            <Link
              href="/register"
              className="rounded-md border border-paper-edge bg-white px-6 py-3 font-semibold text-ink transition hover:border-verdigris"
            >
              Start a campaign
            </Link>
          </div>
        </div>
      </section>

      {/* Three principles — a ledger, not a feature grid */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-px overflow-hidden rounded-lg border border-paper-edge bg-paper-edge sm:grid-cols-3">
          {[
            {
              k: "Escrow",
              t: "Funds held, not forwarded",
              d: "Donations sit in the contract until the goal is reached. No goal, no release.",
            },
            {
              k: "Refunds",
              t: "Your money, returned",
              d: "If a campaign misses its deadline, every backer can claim a full refund on-chain.",
            },
            {
              k: "Proof",
              t: "Verify every transaction",
              d: "Each donation has a transaction hash you can inspect on Polygonscan yourself.",
            },
          ].map((item) => (
            <div key={item.k} className="bg-paper p-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-verdigris">
                {item.k}
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold text-ink">{item.t}</h3>
              <p className="mt-2 text-sm text-ink-soft">{item.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
