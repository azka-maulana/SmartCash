interface LandingProps {
  onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
  return (
    <div className="sc-landing min-h-full bg-[#0F172A] text-white flex flex-col">
      {/* Header */}
      <header className="px-8 py-5 flex items-center justify-between border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-semibold text-base tracking-tight">Smart Cash</span>
        </div>
        <button
          onClick={onGetStarted}
          className="text-sm text-slate-300 hover:text-white transition-colors font-medium"
        >
          Sign in
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
      
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight max-w-2xl leading-tight mb-6">
          Group money,<br />
          <span className="text-blue-400">made transparent.</span>
        </h1>

        <p className="text-slate-400 text-lg max-w-md leading-relaxed mb-10">
          Smart Cash keeps your class or group's finances clear, accountable, and easy to understand — for everyone.
        </p>

        <button
          onClick={onGetStarted}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-blue-500/20"
        >
          Get started
        </button>

        {/* Feature pills */}
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {[
            "Full transparency for all members",
            "Admin-controlled records",
            "AI insights & assistant",
            "Contribution tracking",
          ].map((f) => (
            <span key={f} className="text-xs text-slate-400 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
              {f}
            </span>
          ))}
        </div>
      </main>

      <footer className="px-8 py-5 border-t border-white/8 text-slate-600 text-xs text-center">
        Smart Cash
      </footer>
    </div>
  );
}
