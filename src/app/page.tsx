import Link from "next/link";
import Image from "next/image";

const coreFeatures = [
  {
    img: "blockchain",
    title: "Blockchain Security",
    desc: "All transactions are stored on an immutable blockchain ledger.",
  },
  {
    img: "smart-contract",
    title: "Smart Contracts",
    desc: "Funds are handled automatically without third-party control.",
  },
  {
    img: "transparency",
    title: "Full Transparency",
    desc: "Every donor can track funds in real-time.",
  },
];

const whyUs = [
  {
    img: "trust",
    title: "Trustless System",
    desc: "Donors do not need to trust any organization. Blockchain itself ensures fairness and accuracy.",
  },
  {
    img: "global",
    title: "Global Donations",
    desc: "Anyone from anywhere in the world can donate using crypto wallets without bank involvement.",
  },
  {
    img: "fraud",
    title: "Fraud Prevention",
    desc: "Smart contracts prevent misuse of funds and stop unauthorized access.",
  },
];

const steps = [
  { n: "1. Connect Wallet", desc: "User connects a crypto wallet to access the platform." },
  { n: "2. Choose Campaign", desc: "Select verified campaigns deployed via smart contracts." },
  { n: "3. Donate Securely", desc: "Donation is held in escrow and recorded on-chain instantly." },
];

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="px-5 py-24 text-center sm:py-28">
        <h2 className="text-gradient-hero mx-auto max-w-4xl text-4xl font-bold leading-tight sm:text-5xl">
          Blockchain Powered Fundraising Platform
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          BLOCK AID is a decentralized donation platform that ensures transparency, security and
          trust using blockchain technology.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/campaigns"
            className="rounded-full bg-gradient-to-br from-purple-deep to-cyan px-8 py-3.5 font-semibold text-white shadow-glow-primary transition hover:scale-105"
          >
            Explore Campaigns
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-cyan px-8 py-3.5 font-semibold text-cyan transition hover:bg-cyan hover:text-ink"
          >
            Connect Wallet
          </Link>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section className="flex flex-wrap justify-center gap-6 px-6 py-12">
        {coreFeatures.map((f) => (
          <div
            key={f.title}
            className="glass w-64 p-7 text-center transition hover:-translate-y-2.5 hover:shadow-glow-strong"
          >
            <Image
              src={`/images/${f.img}.png`}
              alt=""
              width={60}
              height={60}
              className="mx-auto mb-4 h-[60px] w-[60px] object-contain"
            />
            <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
            <p className="text-sm text-muted">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* WHY CHOOSE US */}
      <section className="px-6 py-12 sm:px-16">
        <h2 className="text-gradient mb-6 text-3xl font-bold">Why Choose BLOCK AID?</h2>
        <p className="mb-8 max-w-4xl text-muted">
          Traditional fundraising platforms often suffer from lack of transparency, delayed fund
          transfers and trust issues. BLOCK AID overcomes these problems by using blockchain
          technology, making the entire donation process secure, traceable and decentralized.
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          {whyUs.map((f) => (
            <div
              key={f.title}
              className="glass w-64 p-7 text-center transition hover:-translate-y-2.5 hover:shadow-glow-strong"
            >
              <Image
                src={`/images/${f.img}.png`}
                alt=""
                width={60}
                height={60}
                className="mx-auto mb-4 h-[60px] w-[60px] object-contain"
              />
              <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-4xl text-muted">
          BLOCK AID is designed as an academic Final Year Project to demonstrate real-world
          application of blockchain in social welfare systems. The platform promotes accountability,
          efficiency and donor confidence.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-12 sm:px-16">
        <h2 className="text-gradient mb-6 text-3xl font-bold">How BLOCK AID Works</h2>
        <div className="flex flex-wrap justify-center gap-6">
          {steps.map((s) => (
            <div key={s.n} className="glass w-64 p-7 text-center">
              <h3 className="mb-2 text-lg font-semibold text-white">{s.n}</h3>
              <p className="text-sm text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
