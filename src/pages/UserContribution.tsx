import { type DemoContribution, type Page } from "../App";
import { type ApiContribution } from "../services/apiService";
import { formatRupiah, formatDate } from "../utils/format";

interface DemoUser {
  id: string;
  name: string;
  nim: string;
  role: string;
  initials: string;
}

interface UserContributionProps {
  navigate: (page: Page) => void;
  currentUser: DemoUser;
  contribution: DemoContribution | null;
  deriveStatus: (c: DemoContribution) => "paid" | "partial" | "unpaid";
  history: ApiContribution[];
}

export default function UserContribution({
  navigate,
  currentUser,
  contribution,
  deriveStatus,
  history,
}: UserContributionProps) {
  const expectedAmount = contribution?.expected_amount ?? 0;
  const paidAmount     = contribution?.paid_amount ?? 0;
  const remaining      = Math.max(0, expectedAmount - paidAmount);
  const status         = contribution ? deriveStatus(contribution) : "unpaid";
  const percentPaid    = expectedAmount > 0 ? Math.min((paidAmount / expectedAmount) * 100, 100) : 0;
  const lastPayment    = contribution?.paidAt ?? null;

  // Build a simple payment history from the contribution (period-based)
  const historyEntries = history.map((entry) => ({
    period: entry.period,
    amount: entry.paid_amount,
    paidAt: entry.paidAt,
    status: entry.status,
  }));

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("user-dashboard")} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h2 className="text-slate-900 font-semibold text-lg">My Contribution</h2>
      </div>

      {/* Status card */}
      <div className="bg-[#0F172A] rounded-xl p-5 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">
            {currentUser.initials}
          </div>
          <div>
            <div className="font-semibold text-white">{currentUser.name}</div>
            <div className="text-slate-400 text-sm">{currentUser.nim}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 min-[360px]:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <div>
            <div className="text-slate-400 text-xs mb-0.5">Total due</div>
            <div className="font-mono font-bold text-white">{formatRupiah(expectedAmount)}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs mb-0.5">Paid</div>
            <div className="font-mono font-bold text-green-400">{formatRupiah(paidAmount)}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs mb-0.5">Remaining</div>
            <div className="font-mono font-bold text-white">{formatRupiah(remaining)}</div>
          </div>
        </div>

        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1.5">
          <div
            className={`h-full rounded-full transition-all ${
              status === "paid" ? "bg-green-500" : status === "partial" ? "bg-amber-400" : "bg-red-400"
            }`}
            style={{ width: `${percentPaid}%` }}
          />
        </div>
        <div className="text-slate-400 text-xs">{percentPaid.toFixed(0)}% of total contribution paid</div>
      </div>

      {/* Overall status badge */}
      <div className={`flex items-center gap-3 rounded-xl p-4 border ${
        status === "paid"
          ? "bg-green-50 border-green-200"
          : status === "partial"
          ? "bg-amber-50 border-amber-200"
          : "bg-red-50 border-red-200"
      }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          status === "paid" ? "bg-green-100" : status === "partial" ? "bg-amber-100" : "bg-red-100"
        }`}>
          {status === "paid" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          ) : status === "partial" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4M12 16h.01" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          )}
        </div>
        <div>
          <div className={`font-semibold text-sm ${
            status === "paid" ? "text-green-800" : status === "partial" ? "text-amber-800" : "text-red-800"
          }`}>
            {status === "paid" ? "All contributions paid" : status === "partial" ? "Partial payment recorded" : "No payment recorded"}
          </div>
          <div className={`text-xs mt-0.5 ${
            status === "paid" ? "text-green-600" : status === "partial" ? "text-amber-600" : "text-red-600"
          }`}>
            {lastPayment ? `Last payment: ${formatDate(lastPayment)}` : "No payments yet"}
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <span className="font-semibold text-slate-900 text-sm">Payment history</span>
        </div>
        <div className="divide-y divide-slate-100">
          {historyEntries.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No payments yet</div>
          ) : (
            historyEntries.map((entry, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <div className="text-slate-900 text-sm font-medium">
                    {entry.period ? `Period ${entry.period}` : "—"}
                  </div>
                  <div className="text-slate-400 text-xs">
                    {entry.paidAt ? formatDate(entry.paidAt) : "—"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-green-600 text-sm">{formatRupiah(entry.amount)}</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 border ${
                    entry.status === "paid"
                      ? "text-green-700 bg-green-50 border-green-200"
                      : entry.status === "partial"
                      ? "text-amber-700 bg-amber-50 border-amber-200"
                      : "text-red-700 bg-red-50 border-red-200"
                  }`}>
                    {entry.status === "paid" && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                    )}
                    {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
