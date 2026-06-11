export function Footer() {
  return (
    <footer className="border-t border-paper-edge bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-sm text-ink-soft sm:flex-row">
        <p>
          <span className="font-display font-semibold text-ink">BlockAid</span> — Final Year
          Project, University of Lahore
        </p>
        <p className="text-xs">Donations held in escrow · Verifiable on Polygon Amoy</p>
      </div>
    </footer>
  );
}
