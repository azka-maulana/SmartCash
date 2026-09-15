interface LandingProps {
  onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
  return (
    <div className="sc-landing min-h-full bg-[#0b1020] text-white flex flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-400/5 blur-3xl" />
      </div>

      <header className="relative z-10 px-6 sm:px-8 lg:px-10 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/15">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-semibold text-[15px] tracking-tight">Smart Cash</span>
        </div>

        <button
          onClick={onGetStarted}
          className="group inline-flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.09] hover:shadow-lg hover:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
        >
          Sign in
          <svg className="transition-transform duration-300 group-hover:translate-x-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </button>
      </header>

      <main className="relative z-10 flex-1 flex items-center">
        <section className="w-full px-6 sm:px-8 lg:px-10 py-20 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-14 lg:gap-20 items-end">
              <div className="max-w-3xl">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 mb-7">
                  Shared cash, made clear.
                </p>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.055em] leading-[0.98] text-white">
                  Keep group money
                  <br />
                  <span className="text-slate-400">simple and visible.</span>
                </h1>

                <p className="mt-7 max-w-xl text-base sm:text-lg leading-7 text-slate-400">
                  Track transactions, contributions, and the current cash position in one place — with an assistant that helps you find the information you need.
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <button
                    onClick={onGetStarted}
                    className="group inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    Get started
                    <svg className="transition-transform duration-300 group-hover:translate-x-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </button>
                  <span className="text-sm text-slate-500">Admin manages · User monitors</span>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="border-l border-white/10 pl-8 pb-2">
                  <p className="text-sm leading-6 text-slate-500 max-w-xs">
                    One place for the records your group needs to keep money clear, accountable, and easy to follow.
                  </p>
                  <div className="mt-8 h-px w-full max-w-xs bg-white/8" />
                  <div className="mt-5 flex gap-6 text-xs text-slate-500">
                    <span>Transactions</span>
                    <span>Contributions</span>
                    <span>Members</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 px-6 sm:px-8 lg:px-10 py-5 text-[11px] text-slate-600">
        <div className="mx-auto max-w-6xl flex items-center justify-between border-t border-white/8 pt-5">
          <span>Smart Cash</span>
          <span>Development / Demo</span>
        </div>
      </footer>
    </div>
  );
}
