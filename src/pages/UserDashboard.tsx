import { type DemoTransaction, type DemoContribution, type Page } from "../App";
import { type ApiGroup, type ApiGroupSummary, type ApiMember } from "../services/apiService";
import { formatRupiah, formatDateShort } from "../utils/format";

interface DemoUser { id: string; name: string; nim: string; role: string; initials: string; }
interface UserDashboardProps {
  navigate: (page: Page) => void;
  transactions: DemoTransaction[];
  contributions: DemoContribution[];
  members: ApiMember[];
  currentUser: DemoUser;
  currentUserContribution: DemoContribution | null;
  deriveStatus: (c: DemoContribution) => "paid" | "partial" | "unpaid";
  loading: boolean;
  period: string;
  group: ApiGroup | null;
  summary: ApiGroupSummary | null;
}

export default function UserDashboard({ navigate, transactions, contributions, currentUser, currentUserContribution, deriveStatus, loading, period, group, summary }: UserDashboardProps) {
  const posted = transactions.filter((transaction) => transaction.status !== "voided");
  const balance = summary?.balance ?? 0;
  const totalIncome = summary?.monthlyIncome ?? 0;
  const totalExpense = summary?.monthlyExpense ?? 0;
  const periodContributions = contributions.filter((contribution) => contribution.period === period);
  const paidCount = summary?.contributionStatus.paid ?? periodContributions.filter((c) => c.status === "paid").length;
  const partialCount = summary?.contributionStatus.partial ?? periodContributions.filter((c) => c.status === "partial").length;
  const unpaidCount = summary?.contributionStatus.unpaid ?? periodContributions.filter((c) => c.status === "unpaid").length;
  const memberCount = summary?.memberCount ?? 0;
  const myStatus = currentUserContribution ? deriveStatus(currentUserContribution) : "unpaid";
  const myPaid = currentUserContribution?.paid_amount ?? 0;
  const myExpected = currentUserContribution?.expected_amount ?? 0;
  const myPercent = myExpected > 0 ? Math.min((myPaid / myExpected) * 100, 100) : 0;
  const periodLabel = new Date(`${period}-01`).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  if (loading) return <div className="p-4 sm:p-6 text-slate-400 text-sm">Loading dashboard data...</div>;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div><h2 className="text-slate-900 font-semibold text-xl">Hello, {currentUser.name.split(" ")[0]}</h2><p className="text-slate-500 text-sm mt-0.5">{group?.name ?? "Group"} · {periodLabel}</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="sc-balance-card bg-[#0F172A] rounded-xl p-5 text-white"><div className="text-slate-400 text-xs font-medium tracking-wide uppercase mb-1">Group Balance</div><div className="text-3xl font-bold font-mono mt-1">{formatRupiah(balance)}</div><div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-3"><div><div className="text-slate-500 text-xs mb-0.5">Total Income</div><div className="text-green-400 font-semibold font-mono text-sm">{formatRupiah(totalIncome)}</div></div><div><div className="text-slate-500 text-xs mb-0.5">Total Expenses</div><div className="text-red-400 font-semibold font-mono text-sm">{formatRupiah(totalExpense)}</div></div></div></div>
        <div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-3">My Contribution</div><div className="font-semibold text-sm text-slate-800">{myStatus === "paid" ? "All paid" : myStatus === "partial" ? "Partial payment" : "Not paid"}</div><div className="text-slate-500 text-xs mt-1">{formatRupiah(myPaid)} of {formatRupiah(myExpected)}</div><div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4 mb-2"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${myPercent}%` }} /></div><button onClick={() => navigate("user-contribution")} className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer">View contribution history →</button></div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3"><div><div className="text-xs font-semibold text-blue-700 mb-1">Financial status</div><p className="text-blue-800 text-sm leading-relaxed">The group&apos;s balance is {formatRupiah(balance)}. {paidCount} of {memberCount} members have paid their contributions this month.</p></div><button onClick={() => navigate("ai-assistant")} className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0 cursor-pointer">Ask AI →</button></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="md:col-span-2 bg-white rounded-xl border border-slate-200"><div className="flex items-center justify-between px-5 py-4 border-b border-slate-100"><span className="font-semibold text-slate-900 text-sm">Recent Transactions</span><button onClick={() => navigate("transactions")} className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer">View all →</button></div><div className="divide-y divide-slate-100">{posted.slice(0, 4).map((transaction) => <button key={transaction.id} onClick={() => navigate("transactions")} className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 text-left cursor-pointer"><div className="flex-1 min-w-0"><div className="text-slate-900 text-sm font-medium truncate">{transaction.description}</div><div className="text-slate-400 text-xs">{transaction.category} · {formatDateShort(transaction.date)}</div></div><div className={`font-semibold font-mono text-sm ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>{transaction.type === "income" ? "+" : "-"}{formatRupiah(transaction.amount)}</div></button>)}{posted.length === 0 && <div className="py-10 text-center text-slate-400 text-sm">No transactions yet</div>}</div></div><div className="bg-white rounded-xl border border-slate-200 p-5"><div className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-4">Group Contribution</div><div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-green-700">Paid</span><strong>{paidCount}</strong></div><div className="flex justify-between"><span className="text-amber-700">Partial</span><strong>{partialCount}</strong></div><div className="flex justify-between"><span className="text-red-700">Unpaid</span><strong>{unpaidCount}</strong></div></div></div></div>
    </div>
  );
}
