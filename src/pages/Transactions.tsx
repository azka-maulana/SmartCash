import { useState } from "react";
import { type DemoTransaction, type Page, type Role } from "../App";
import { formatRupiah, formatDate } from "../utils/format";

interface TransactionsProps {
  role: Role;
  navigate: (page: Page, params?: Record<string, string>) => void;
  transactions: DemoTransaction[];
  loading: boolean;
}

const CATEGORIES = ["All", "Contribution", "Event", "Printing", "Activity", "Supplies", "Other"];

export default function Transactions({ role, navigate, transactions, loading }: TransactionsProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [category, setCategory] = useState("All");

  const filteredTransactions = transactions.filter((transaction) => {
    const matchSearch =
      transaction.description.toLowerCase().includes(search.toLowerCase()) ||
      transaction.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || transaction.type === filter;
    const matchCat = category === "All" || transaction.category === category;
    return matchSearch && matchFilter && matchCat;
  });

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Loading transactions…
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900 font-semibold text-xl">Transactions</h2>
          <p className="text-slate-500 text-sm mt-0.5">{transactions.length} total records</p>
        </div>
        {role === "admin" && (
          <button
            onClick={() => navigate("add-transaction")}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Transaction
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search transactions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Type filter + category */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          {(["all", "income", "expense"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                filter === f
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {f === "all" ? "All types" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <div className="hidden sm:block w-px h-4 bg-slate-200 mx-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                category === cat
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <svg className="mx-auto mb-3 text-slate-300" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <div className="text-sm font-medium text-slate-500">No transactions found</div>
            <div className="text-xs text-slate-400 mt-1">Try adjusting your filters</div>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              onClick={() => navigate("transaction-detail", { id: transaction.id })}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TransactionRow({ transaction, onClick }: { transaction: DemoTransaction; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left group cursor-pointer"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
        transaction.type === "income" ? "bg-green-50" : "bg-red-50"
      }`}>
        {transaction.type === "income" ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-900 text-sm font-medium truncate">{transaction.description}</span>
          {transaction.hasReceipt && (
            <span className="shrink-0 text-slate-400" title="Has receipt">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-slate-400 text-xs">{transaction.category}</span>
          <span className="text-slate-300 text-xs">·</span>
          <span className="text-slate-400 text-xs">{formatDate(transaction.date)}</span>
          {transaction.person && (
            <>
              <span className="text-slate-300 text-xs">·</span>
              <span className="text-slate-400 text-xs truncate">{transaction.person}</span>
            </>
          )}
        </div>
      </div>

      <div className="text-right shrink-0 flex flex-col items-end gap-1">
        <div className={`font-semibold font-mono text-sm ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
          {transaction.type === "income" ? "+" : "−"}{formatRupiah(transaction.amount)}
        </div>
        {transaction.status === "voided" ? (
          <span className="text-xs font-medium text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">Voided</span>
        ) : null}
      </div>

      <svg className="text-slate-300 group-hover:text-slate-400 transition-colors shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}
