import { type DemoTransaction, type DemoContribution, type Page } from "../App";
import { type ApiGroup, type ApiGroupSummary, type ApiMember } from "../services/apiService";
import { formatRupiah, formatDateShort } from "../utils/format";

interface AdminDashboardProps {
  navigate: (page: Page, params?: Record<string, string>) => void;
  transactions: DemoTransaction[];
  contributions: DemoContribution[];
  members: ApiMember[];
  loading: boolean;
  period: string;
  group: ApiGroup | null;
  summary: ApiGroupSummary | null;
}

function StatusDot({ status }: { status: "paid" | "partial" | "unpaid" }) {
  if (status === "paid")
    return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">Paid</span>;
  if (status === "partial")
    return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">Partial</span>;
  return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">Unpaid</span>;
}

/** Derives balance from posted (non-voided) transactions */
export default function AdminDashboard({ navigate, transactions, contributions, members, loading, period, group, summary }: AdminDashboardProps) {
  const balance = summary?.balance ?? 0;
  const totalIncome = summary?.monthlyIncome ?? 0;
  const totalExpense = summary?.monthlyExpense ?? 0;
  const recentTransactions = transactions.filter((t) => t.status !== "voided").slice(0, 5);

  // ── Derived contribution counts for current period ──────────────────────────
  const periodContribs = contributions.filter((c) => c.period === period);
  const paidCount    = summary?.contributionStatus.paid ?? periodContribs.filter((c) => c.status === "paid").length;
  const partialCount = summary?.contributionStatus.partial ?? periodContribs.filter((c) => c.status === "partial").length;
  const unpaidCount  = summary?.contributionStatus.unpaid ?? periodContribs.filter((c) => c.status === "unpaid").length;
  const memberCount  = summary?.memberCount ?? members.length;

  // ── Members needing attention ───────────────────────────────────────────────
  const memberContribMap: Record<string, "paid" | "partial" | "unpaid"> = {};
  for (const c of periodContribs) {
    memberContribMap[c.user_id] = c.status as "paid" | "partial" | "unpaid";
  }

  const unpaidMembers = members
    .filter((m) => {
      const st = memberContribMap[m.user_id] ?? "unpaid";
      return st !== "paid";
    })
    .slice(0, 3);

  const getMemberStatus = (userId: string): "paid" | "partial" | "unpaid" =>
    memberContribMap[userId] ?? "unpaid";

  const periodLabel = period
    ? new Date(period + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    : period;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Loading dashboard data…
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Page intro */}
      <div>
        <h2 className="text-slate-900 font-semibold text-xl">Overview</h2>
        <p className="text-slate-500 text-sm mt-0.5">{group?.name ?? "Group"} · {periodLabel}</p>
      </div>

      {/* Balance + metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Balance card */}
        <div className="sc-balance-card md:col-span-1 bg-[#0F172A] rounded-xl p-5 text-white">
          <div className="text-slate-400 text-xs font-medium tracking-wide uppercase mb-1">Current Balance</div>
          <div className="text-3xl font-bold font-mono mt-1">{formatRupiah(balance)}</div>
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
            <div>
              <div className="text-slate-500 text-xs mb-0.5">Income</div>
              <div className="text-green-400 font-semibold font-mono text-sm">{formatRupiah(totalIncome)}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs mb-0.5">Expenses</div>
              <div className="text-red-400 font-semibold font-mono text-sm">{formatRupiah(totalExpense)}</div>
            </div>
          </div>
        </div>

        {/* Metric cards */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          {/* Contribution status */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-slate-500 text-xs font-medium mb-3 uppercase tracking-wide">Contribution Status</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-slate-700">Paid</span>
                </div>
                <span className="font-semibold text-slate-900 font-mono text-sm">{paidCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-sm text-slate-700">Partial</span>
                </div>
                <span className="font-semibold text-slate-900 font-mono text-sm">{partialCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-sm text-slate-700">Unpaid</span>
                </div>
                <span className="font-semibold text-slate-900 font-mono text-sm">{unpaidCount}</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${memberCount > 0 ? (paidCount / memberCount) * 100 : 0}%` }} />
            </div>
            <div className="text-xs text-slate-400 mt-1.5">{paidCount}/{memberCount} paid</div>
          </div>

          {/* Members */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wide">Members</div>
            <div className="text-3xl font-bold font-mono text-slate-900">{memberCount}</div>
            <div className="text-xs text-slate-500 mt-0.5">total enrolled</div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              Contribution amounts are read from database records.
            </div>
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
          </svg>
        </div>
        <div>
          <div className="text-xs font-semibold text-blue-700 mb-1">AI Insight</div>
          <p className="text-blue-800 text-sm leading-relaxed">
            Current balance is {formatRupiah(balance)}. Total income {formatRupiah(totalIncome)}, expenses {formatRupiah(totalExpense)}.
            {unpaidCount > 0 ? ` ${unpaidCount} member${unpaidCount > 1 ? "s have" : " has"} outstanding contributions — consider sending a reminder.` : " All members are up to date."}
          </p>
        </div>
        <button
          onClick={() => navigate("ai-assistant")}
          className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0 cursor-pointer"
        >
          Ask AI →
        </button>
      </div>

      {/* Quick actions */}
      <div>
        <div className="text-sm font-semibold text-slate-700 mb-3">Quick actions</div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("add-transaction", { type: "income" })}
            className="sc-action sc-action-income flex items-center gap-2 font-medium px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" />
            </svg>
            Add Income
          </button>
          <button
            onClick={() => navigate("add-transaction", { type: "expense" })}
            className="sc-action sc-action-expense flex items-center gap-2 font-medium px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M8 12h8" />
            </svg>
            Add Expense
          </button>
          <button
            onClick={() => navigate("members")}
            className="sc-action sc-action-payment flex items-center gap-2 font-medium px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12a2 2 0 0 0 2 2h14v-4" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
            Record Payment
          </button>
        </div>
      </div>

      {/* Two-column: recent transactions + attention */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recent transactions */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <span className="font-semibold text-slate-900 text-sm">Recent Transactions</span>
            <button
              onClick={() => navigate("transactions")}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              View all →
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentTransactions.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">No transactions yet</div>
            ) : (
              recentTransactions.map((transaction) => (
                <button
                  key={transaction.id}
                  onClick={() => navigate("transaction-detail", { id: transaction.id })}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    transaction.type === "income" ? "bg-green-50" : "bg-red-50"
                  }`}>
                    {transaction.type === "income" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M19 12l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-900 text-sm font-medium truncate">{transaction.description}</div>
                    <div className="text-slate-400 text-xs">{transaction.category} · {formatDateShort(transaction.date)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-semibold font-mono text-sm ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {transaction.type === "income" ? "+" : "−"}{formatRupiah(transaction.amount)}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Needs attention */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <span className="font-semibold text-slate-900 text-sm">Needs Attention</span>
          </div>
          <div className="p-4 space-y-2">
            {unpaidMembers.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-xs">All contributions up to date</div>
            ) : (
              unpaidMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{member.name}</div>
                    <div className="text-xs text-slate-400">{member.nim}</div>
                  </div>
                  <StatusDot status={getMemberStatus(member.user_id)} />
                </div>
              ))
            )}
            <button
              onClick={() => navigate("members")}
              className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-2 cursor-pointer"
            >
              Manage members →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
